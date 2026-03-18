import { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import type { EnemyState } from '../types';
import { EnemyBehaviorState, EnemyType, Difficulty } from '../types';
import { useAudioSystem } from '../hooks/useAudioSystem';

// Enemy AI Configuration
const ENEMY_CONFIG: Record<string, {
  health: number;
  speed: number;
  detectionRange: number;
  attackRange: number;
  damage: number;
  patrolSpeed: number;
  chaseSpeed: number;
  color: number;
  opacity: number;
  height: number;
}> = {
  [EnemyType.GHOST]: {
    health: 100,
    speed: 2.5,
    detectionRange: 15,
    attackRange: 1.5,
    damage: 25,
    patrolSpeed: 1,
    chaseSpeed: 3.5,
    color: 0xff0000,
    opacity: 0.7,
    height: 1.8
  },
  [EnemyType.DEMON]: {
    health: 200,
    speed: 3,
    detectionRange: 20,
    attackRange: 2,
    damage: 40,
    patrolSpeed: 1.5,
    chaseSpeed: 5,
    color: 0x8b0000,
    opacity: 1,
    height: 2.2
  },
  [EnemyType.POSSESSED]: {
    health: 150,
    speed: 2,
    detectionRange: 12,
    attackRange: 1.2,
    damage: 30,
    patrolSpeed: 0.8,
    chaseSpeed: 4,
    color: 0x4a0000,
    opacity: 1,
    height: 1.7
  },
  [EnemyType.SHADOW]: {
    health: 75,
    speed: 4,
    detectionRange: 18,
    attackRange: 1,
    damage: 20,
    patrolSpeed: 2,
    chaseSpeed: 6,
    color: 0x000000,
    opacity: 0.5,
    height: 1.9
  },
  [EnemyType.BOSS]: {
    health: 1000,
    speed: 1.5,
    detectionRange: 30,
    attackRange: 3,
    damage: 60,
    patrolSpeed: 0.5,
    chaseSpeed: 2.5,
    color: 0x4a0000,
    opacity: 1,
    height: 3.5
  }
};

// Individual Enemy Component
function Enemy({ enemy }: { enemy: EnemyState }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { scene } = useThree();
  const { playSFX } = useAudioSystem();
  
  const playerPosition = useGameStore((state) => state.player.position);
  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);
  const difficulty = useGameStore((state) => state.difficulty);
  
  const updateEnemy = useGameStore((state) => state.updateEnemy);
  const updatePlayerHealth = useGameStore((state) => state.updatePlayerHealth);
  const updatePlayerSanity = useGameStore((state) => state.updatePlayerSanity);

  const config = ENEMY_CONFIG[enemy.type] || ENEMY_CONFIG[EnemyType.GHOST];
  const raycaster = useRef(new THREE.Raycaster());
  const lastAttackTime = useRef(0);
  const stateTimer = useRef(0);

  // Check if player is visible
  const canSeePlayer = useCallback((): boolean => {
    const direction = new THREE.Vector3().subVectors(playerPosition, enemy.position).normalize();
    raycaster.current.set(enemy.position, direction);
    
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const distance = intersects[0].distance;
      const playerDistance = enemy.position.distanceTo(playerPosition);
      
      // If first intersection is closer than player, player is blocked
      if (distance < playerDistance - 0.5) {
        return false;
      }
    }
    
    return true;
  }, [playerPosition, enemy.position, scene]);

  // Calculate distance to player
  const getDistanceToPlayer = useCallback((): number => {
    return enemy.position.distanceTo(playerPosition);
  }, [enemy.position, playerPosition]);

  // AI Behavior Tree
  const updateAI = useCallback((delta: number) => {
    if (!isGameActive || isPaused) return;

    const distance = getDistanceToPlayer();
    const canSee = canSeePlayer();
    const difficultyMultiplier: Record<string, number> = {
      [Difficulty.EASY]: 0.7,
      [Difficulty.NORMAL]: 1,
      [Difficulty.HARD]: 1.3,
      [Difficulty.NIGHTMARE]: 1.6
    };
    const multiplier = difficultyMultiplier[difficulty] || 1;

    stateTimer.current += delta;

    switch (enemy.state) {
      case EnemyBehaviorState.IDLE:
        // Transition to patrol after random time
        if (stateTimer.current > 3 + Math.random() * 2) {
          updateEnemy(enemy.id, { 
            state: EnemyBehaviorState.PATROL,
            currentPatrolIndex: Math.floor(Math.random() * (enemy.patrolPath?.length || 1))
          });
          stateTimer.current = 0;
        }
        
        // Check for player
        if (distance < config.detectionRange * multiplier && canSee) {
          updateEnemy(enemy.id, { 
            state: EnemyBehaviorState.CHASE,
            lastKnownPlayerPosition: playerPosition.clone()
          });
          playSFX('enemy_alert', { volume: 0.6 });
        }
        break;

      case EnemyBehaviorState.PATROL:
        if (!enemy.patrolPath || enemy.patrolPath.length === 0) {
          updateEnemy(enemy.id, { state: EnemyBehaviorState.IDLE });
          break;
        }

        const targetPoint = enemy.patrolPath[enemy.currentPatrolIndex];
        const patrolDirection = new THREE.Vector3().subVectors(targetPoint, enemy.position).normalize();
        const newPosition = enemy.position.clone().add(
          patrolDirection.multiplyScalar(config.patrolSpeed * delta)
        );

        // Check if reached patrol point
        if (enemy.position.distanceTo(targetPoint) < 0.5) {
          const nextIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPath.length;
          updateEnemy(enemy.id, { currentPatrolIndex: nextIndex });
        }

        updateEnemy(enemy.id, { 
          position: newPosition,
          rotation: new THREE.Euler(0, Math.atan2(patrolDirection.x, patrolDirection.z), 0)
        });

        // Check for player
        if (distance < config.detectionRange * multiplier && canSee) {
          updateEnemy(enemy.id, { 
            state: EnemyBehaviorState.CHASE,
            lastKnownPlayerPosition: playerPosition.clone()
          });
          playSFX('enemy_alert', { volume: 0.6 });
        }
        break;

      case EnemyBehaviorState.INVESTIGATE:
        if (enemy.lastKnownPlayerPosition) {
          const investigateDirection = new THREE.Vector3().subVectors(
            enemy.lastKnownPlayerPosition, 
            enemy.position
          ).normalize();
          
          const investigatePosition = enemy.position.clone().add(
            investigateDirection.multiplyScalar(config.speed * delta)
          );

          updateEnemy(enemy.id, { 
            position: investigatePosition,
            rotation: new THREE.Euler(0, Math.atan2(investigateDirection.x, investigateDirection.z), 0)
          });

          // Check if reached investigation point
          if (enemy.position.distanceTo(enemy.lastKnownPlayerPosition) < 1) {
            updateEnemy(enemy.id, { state: EnemyBehaviorState.IDLE });
          }

          // Check for player during investigation
          if (distance < config.detectionRange * multiplier && canSee) {
            updateEnemy(enemy.id, { state: EnemyBehaviorState.CHASE });
          }
        }
        break;

      case EnemyBehaviorState.CHASE:
        if (!canSee && stateTimer.current > 5) {
          updateEnemy(enemy.id, { 
            state: EnemyBehaviorState.INVESTIGATE,
            lastKnownPlayerPosition: playerPosition.clone()
          });
          stateTimer.current = 0;
          break;
        }

        if (canSee) {
          updateEnemy(enemy.id, { lastKnownPlayerPosition: playerPosition.clone() });
          stateTimer.current = 0;
        }

        // Move towards player
        const chaseDirection = new THREE.Vector3().subVectors(
          enemy.lastKnownPlayerPosition || playerPosition, 
          enemy.position
        ).normalize();
        
        const chasePosition = enemy.position.clone().add(
          chaseDirection.multiplyScalar(config.chaseSpeed * multiplier * delta)
        );

        updateEnemy(enemy.id, { 
          position: chasePosition,
          rotation: new THREE.Euler(0, Math.atan2(chaseDirection.x, chaseDirection.z), 0)
        });

        // Check attack range
        if (distance < config.attackRange) {
          updateEnemy(enemy.id, { state: EnemyBehaviorState.ATTACK });
        }

        // Drain player sanity when being chased
        updatePlayerSanity(useGameStore.getState().player.sanity - 5 * delta);
        break;

      case EnemyBehaviorState.ATTACK:
        const now = Date.now();
        if (now - lastAttackTime.current > 1000) {
          updatePlayerHealth(useGameStore.getState().player.health - config.damage * multiplier);
          updatePlayerSanity(useGameStore.getState().player.sanity - 10);
          playSFX('enemy_attack', { volume: 0.8 });
          lastAttackTime.current = now;
          
          // Screen shake effect could be triggered here
        }

        if (distance > config.attackRange * 1.5) {
          updateEnemy(enemy.id, { state: EnemyBehaviorState.CHASE });
        }
        break;

      case EnemyBehaviorState.STUNNED:
        if (stateTimer.current > 3) {
          updateEnemy(enemy.id, { state: EnemyBehaviorState.CHASE });
          stateTimer.current = 0;
        }
        break;

      case EnemyBehaviorState.DEAD:
        // Death animation or cleanup
        break;
    }
  }, [enemy, isGameActive, isPaused, playerPosition, difficulty, config, updateEnemy, playSFX, updatePlayerHealth, updatePlayerSanity, getDistanceToPlayer, canSeePlayer]);

  // Main update loop
  useFrame((_, delta) => {
    if (meshRef.current && lightRef.current) {
      // Update mesh position
      meshRef.current.position.copy(enemy.position);
      meshRef.current.rotation.copy(enemy.rotation);
      
      // Update light position
      lightRef.current.position.copy(enemy.position);
      lightRef.current.position.y += 1;

      // Floating animation for ghosts
      if (enemy.type === EnemyType.GHOST || enemy.type === EnemyType.SHADOW) {
        meshRef.current.position.y += Math.sin(Date.now() * 0.002) * 0.1;
      }

      // Update AI
      updateAI(delta);
    }
  });

  // Don't render if dead
  if (enemy.state === EnemyBehaviorState.DEAD) {
    return null;
  }

  return (
    <group>
      {/* Enemy Mesh */}
      <mesh
        ref={meshRef}
        position={enemy.position}
        rotation={enemy.rotation}
      >
        <cylinderGeometry args={[0.3, 0.6, config.height, 10]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.5}
          transparent
          opacity={config.opacity}
        />
      </mesh>
      
      {/* Enemy Glow */}
      <pointLight
        ref={lightRef}
        position={[enemy.position.x, enemy.position.y + 1, enemy.position.z]}
        color={config.color}
        intensity={2}
        distance={5}
        decay={2}
      />
      
      {/* Detection indicator (when alerted) */}
      {(enemy.state === EnemyBehaviorState.CHASE || enemy.state === EnemyBehaviorState.ATTACK) && (
        <mesh position={[enemy.position.x, enemy.position.y + config.height + 0.5, enemy.position.z]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={0xff0000} />
        </mesh>
      )}
    </group>
  );
}

// Enemy Manager Component
export default function EnemyManager() {
  const enemies = useGameStore((state) => state.enemies);
  const spawnEnemy = useGameStore((state) => state.spawnEnemy);
  const isGameActive = useGameStore((state) => state.isGameActive);
  const gameState = useGameStore((state) => state.gameState);

  // Spawn initial enemies based on level
  useEffect(() => {
    if (!isGameActive) return;

    const spawnEnemiesForLevel = () => {
      switch (gameState.currentLevel) {
        case 'church_entrance':
          // No enemies at entrance
          break;
        case 'church_interior':
          spawnEnemy({
            id: 'ghost_1',
            type: EnemyType.GHOST,
            position: new THREE.Vector3(5, 0.9, -10),
            rotation: new THREE.Euler(0, 0, 0),
            health: 100,
            state: EnemyBehaviorState.PATROL,
            patrolPath: [
              new THREE.Vector3(5, 0.9, -10),
              new THREE.Vector3(-5, 0.9, -10),
              new THREE.Vector3(-5, 0.9, -15),
              new THREE.Vector3(5, 0.9, -15)
            ],
            currentPatrolIndex: 0,
            detectionLevel: 0,
            isAlerted: false
          });
          break;
        case 'catacombs':
          spawnEnemy({
            id: 'demon_1',
            type: EnemyType.DEMON,
            position: new THREE.Vector3(0, 1.1, -25),
            rotation: new THREE.Euler(0, 0, 0),
            health: 200,
            state: EnemyBehaviorState.IDLE,
            currentPatrolIndex: 0,
            detectionLevel: 0,
            isAlerted: false
          });
          spawnEnemy({
            id: 'shadow_1',
            type: EnemyType.SHADOW,
            position: new THREE.Vector3(-8, 0.95, -20),
            rotation: new THREE.Euler(0, 0, 0),
            health: 75,
            state: EnemyBehaviorState.PATROL,
            patrolPath: [
              new THREE.Vector3(-8, 0.95, -20),
              new THREE.Vector3(8, 0.95, -20),
              new THREE.Vector3(8, 0.95, -28),
              new THREE.Vector3(-8, 0.95, -28)
            ],
            currentPatrolIndex: 0,
            detectionLevel: 0,
            isAlerted: false
          });
          break;
        case 'ritual_chamber':
          spawnEnemy({
            id: 'boss_1',
            type: EnemyType.BOSS,
            position: new THREE.Vector3(0, 1.75, -35),
            rotation: new THREE.Euler(0, 0, 0),
            health: 1000,
            state: EnemyBehaviorState.IDLE,
            currentPatrolIndex: 0,
            detectionLevel: 0,
            isAlerted: false
          });
          break;
      }
    };

    spawnEnemiesForLevel();
  }, [isGameActive, gameState.currentLevel, spawnEnemy]);

  return (
    <>
      {enemies.map((enemy) => (
        <Enemy key={enemy.id} enemy={enemy} />
      ))}
    </>
  );
}
