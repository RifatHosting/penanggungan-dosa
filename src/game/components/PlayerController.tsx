import { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import useGameStore from '../../store/gameStore';
import { useInputSystem } from '../hooks/useInputSystem';
import { useAudioSystem } from '../hooks/useAudioSystem';

interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
}

export default function PlayerController() {
  const { camera, scene } = useThree();
  const { keys, mouse } = useInputSystem();
  const { playSFX } = useAudioSystem();
  
  // Refs
  const velocity = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const isGrounded = useRef(true);
  const lastFootstepTime = useRef(0);
  
  // Store selectors
  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);
  const player = useGameStore((state) => state.player);
  const difficulty = useGameStore((state) => state.difficulty);
  const controlSettings = useGameStore((state) => state.controlSettings);
  
  // Actions
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerRotation = useGameStore((state) => state.updatePlayerRotation);
  const updatePlayerVelocity = useGameStore((state) => state.updatePlayerVelocity);
  const updatePlayerStamina = useGameStore((state) => state.updatePlayerStamina);
  const setPlayerSprinting = useGameStore((state) => state.setPlayerSprinting);
  const setPlayerCrouching = useGameStore((state) => state.setPlayerCrouching);
  const updatePlayerSanity = useGameStore((state) => state.updatePlayerSanity);

  // Movement constants
  const MOVEMENT_SPEEDS: Record<string, { walk: number; sprint: number; crouch: number }> = {
    easy: { walk: 4, sprint: 7, crouch: 2 },
    normal: { walk: 3.5, sprint: 6, crouch: 1.5 },
    hard: { walk: 3, sprint: 5, crouch: 1.2 },
    nightmare: { walk: 2.5, sprint: 4, crouch: 1 }
  };

  const STAMINA_DRAIN: Record<string, number> = {
    easy: 5,
    normal: 10,
    hard: 15,
    nightmare: 20
  };

  const STAMINA_REGEN: Record<string, number> = {
    easy: 15,
    normal: 10,
    hard: 8,
    nightmare: 5
  };

  // Collision detection
  const checkCollision = useCallback((position: Vector3): boolean => {
    // Get all collidable objects from scene
    const collidableObjects: CollisionBox[] = [];
    
    scene.traverse((object) => {
      if (object.userData.collidable) {
        const box = object.userData.collisionBox;
        if (box) {
          collidableObjects.push(box);
        }
      }
    });

    const playerRadius = 0.45;
    const playerHeight = player.isCrouching ? 1.0 : 1.7;

    for (const box of collidableObjects) {
      if (
        position.x + playerRadius > box.minX &&
        position.x - playerRadius < box.maxX &&
        position.z + playerRadius > box.minZ &&
        position.z - playerRadius < box.maxZ &&
        position.y < box.maxY &&
        position.y + playerHeight > box.minY
      ) {
        return true;
      }
    }

    return false;
  }, [scene, player.isCrouching]);

  // Footstep sound
  const playFootstep = useCallback((isSprinting: boolean) => {
    const now = Date.now();
    const footstepInterval = isSprinting ? 300 : 500;
    
    if (now - lastFootstepTime.current > footstepInterval) {
      const surface = 'concrete'; // Could be determined by ground material
      playSFX(`footstep_${surface}_${Math.floor(Math.random() * 4) + 1}`, {
        volume: isSprinting ? 0.8 : 0.5,
        pitch: 0.9 + Math.random() * 0.2
      });
      lastFootstepTime.current = now;
    }
  }, [playSFX]);

  // Mouse look
  useEffect(() => {
    if (!isGameActive || isPaused) return;

    const sensitivity = controlSettings.mouseSensitivity;
    const invertY = controlSettings.invertY ? -1 : 1;

    const newRotationX = camera.rotation.x - mouse.movementY * sensitivity * invertY;
    const newRotationY = camera.rotation.y - mouse.movementX * sensitivity;

    // Clamp vertical look
    const clampedRotationX = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, newRotationX));

    updatePlayerRotation(new Euler(clampedRotationX, newRotationY, 0));
  }, [mouse, camera, isGameActive, isPaused, controlSettings, updatePlayerRotation]);

  // Main movement loop
  useFrame((_, delta) => {
    if (!isGameActive || isPaused) return;

    const speeds = MOVEMENT_SPEEDS[difficulty];
    let moveSpeed = speeds.walk;

    // Handle sprinting
    if (keys.sprint && player.stamina > 0 && !player.isCrouching) {
      moveSpeed = speeds.sprint;
      setPlayerSprinting(true);
      updatePlayerStamina(player.stamina - STAMINA_DRAIN[difficulty] * delta);
    } else {
      setPlayerSprinting(false);
      // Regenerate stamina
      if (player.stamina < 100) {
        updatePlayerStamina(player.stamina + STAMINA_REGEN[difficulty] * delta);
      }
    }

    // Handle crouching
    if (keys.crouch) {
      setPlayerCrouching(true);
      moveSpeed = speeds.crouch;
    } else {
      setPlayerCrouching(false);
    }

    // Calculate movement direction
    direction.current.set(0, 0, 0);

    if (keys.forward) direction.current.z -= 1;
    if (keys.backward) direction.current.z += 1;
    if (keys.left) direction.current.x -= 1;
    if (keys.right) direction.current.x += 1;

    // Normalize direction
    if (direction.current.length() > 0) {
      direction.current.normalize();
      
      // Apply rotation to direction
      direction.current.applyEuler(new Euler(0, camera.rotation.y, 0));
      
      // Calculate velocity
      velocity.current.x = direction.current.x * moveSpeed;
      velocity.current.z = direction.current.z * moveSpeed;
      
      // Play footstep sounds
      playFootstep(player.isSprinting);
      
      // Drain sanity in dark areas or when enemies are near
      const nearbyEnemies = useGameStore.getState().enemies.filter(
        enemy => enemy.position.distanceTo(player.position) < 10
      );
      
      if (nearbyEnemies.length > 0) {
        const sanityDrain = nearbyEnemies.length * 2 * delta;
        updatePlayerSanity(player.sanity - sanityDrain);
      }
    } else {
      velocity.current.x = 0;
      velocity.current.z = 0;
    }

    // Apply gravity
    if (!isGrounded.current) {
      velocity.current.y -= 9.8 * delta;
    }

    // Calculate new position
    const newPosition = player.position.clone();
    newPosition.x += velocity.current.x * delta;
    newPosition.z += velocity.current.z * delta;
    newPosition.y += velocity.current.y * delta;

    // Ground clamp
    if (newPosition.y < 1.7) {
      newPosition.y = player.isCrouching ? 1.0 : 1.7;
      velocity.current.y = 0;
      isGrounded.current = true;
    }

    // Collision check
    if (!checkCollision(newPosition)) {
      updatePlayerPosition(newPosition);
      updatePlayerVelocity(velocity.current.clone());
    } else {
      // Slide along walls
      const slidePositionX = player.position.clone();
      slidePositionX.x += velocity.current.x * delta;
      
      const slidePositionZ = player.position.clone();
      slidePositionZ.z += velocity.current.z * delta;
      
      if (!checkCollision(slidePositionX)) {
        updatePlayerPosition(slidePositionX);
      } else if (!checkCollision(slidePositionZ)) {
        updatePlayerPosition(slidePositionZ);
      }
    }

    // Update camera position
    camera.position.copy(player.position);
    camera.rotation.copy(player.rotation);

    // Camera bobbing when moving
    if (velocity.current.length() > 0.1) {
      const bobFrequency = player.isSprinting ? 15 : 10;
      const bobAmount = player.isSprinting ? 0.08 : 0.05;
      const bobOffset = Math.sin(Date.now() * 0.001 * bobFrequency) * bobAmount;
      camera.position.y += bobOffset;
    }
  });

  return null;
}
