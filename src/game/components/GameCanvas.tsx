import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import PlayerController from './PlayerController';
import World from './World';
import EnemyManager from './EnemyManager';
import Lighting from './Lighting';
import ParticleSystem from './ParticleSystem';
import { useAudioSystem } from '../hooks/useAudioSystem';

// Camera Controller Component
function CameraController() {
  const { camera } = useThree();
  const playerPosition = useGameStore((state) => state.player.position);
  const playerRotation = useGameStore((state) => state.player.rotation);
  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);

  useFrame(() => {
    if (!isGameActive || isPaused) return;

    // Smooth camera follow
    camera.position.lerp(playerPosition, 0.1);
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, playerRotation.x, 0.1);
    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, playerRotation.y, 0.1);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, playerRotation.z, 0.1);
  });

  return null;
}

// Sanity Effects Component
function SanityEffects() {
  const sanity = useGameStore((state) => state.player.sanity);
  const intensity = Math.max(0, (100 - sanity) / 100);
  
  return (
    <>
      <Noise
        opacity={intensity * 0.3}
        blendFunction={BlendFunction.OVERLAY}
      />
      <ChromaticAberration
        offset={[intensity * 0.01, intensity * 0.01]}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        offset={0.3}
        darkness={intensity * 0.8}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </>
  );
}

// Flashlight Component
function Flashlight() {
  const lightRef = useRef<THREE.SpotLight>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  
  const isEnabled = useGameStore((state) => state.equipment.flashlight.enabled);
  const battery = useGameStore((state) => state.equipment.flashlight.battery);
  const isGameActive = useGameStore((state) => state.isGameActive);
  
  const drainFlashlightBattery = useGameStore((state) => state.drainFlashlightBattery);

  useFrame((_, delta) => {
    if (!isGameActive || !lightRef.current || !glowRef.current) return;
    
    // Update flashlight position to follow camera
    lightRef.current.position.copy(camera.position);
    lightRef.current.rotation.copy(camera.rotation);
    lightRef.current.translateZ(-0.5);
    lightRef.current.translateY(-0.2);
    lightRef.current.translateX(0.1);
    
    glowRef.current.position.copy(camera.position);
    glowRef.current.translateY(-0.3);
    glowRef.current.translateX(0.15);
    
    // Drain battery
    if (isEnabled && battery > 0) {
      drainFlashlightBattery(delta * 2);
    }
    
    // Flicker effect when battery is low
    if (battery < 20 && battery > 0) {
      lightRef.current.intensity = isEnabled 
        ? 4 * (battery / 100) * (0.8 + Math.random() * 0.4)
        : 0;
    } else {
      lightRef.current.intensity = isEnabled && battery > 0 ? 4 * (battery / 100) : 0;
    }
    
    glowRef.current.intensity = isEnabled && battery > 0 ? 1.5 * (battery / 100) : 0;
  });

  return (
    <>
      <spotLight
        ref={lightRef}
        color={0xfffce5}
        intensity={4}
        distance={30}
        angle={Math.PI / 5}
        penumbra={0.75}
        decay={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      <pointLight
        ref={glowRef}
        color={0xfffce5}
        intensity={1.5}
        distance={4}
        decay={2}
      />
    </>
  );
}

// Environment Fog
function EnvironmentFog() {
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);
  const sanity = useGameStore((state) => state.player.sanity);
  
  const getFogSettings = () => {
    const baseDensity = 0.038;
    const sanityMultiplier = 1 + ((100 - sanity) / 100) * 0.5;
    
    switch (currentLevel) {
      case 'church_entrance':
        return { color: 0x050302, density: baseDensity * sanityMultiplier };
      case 'church_interior':
        return { color: 0x080402, density: baseDensity * 1.2 * sanityMultiplier };
      case 'catacombs':
        return { color: 0x020101, density: baseDensity * 1.5 * sanityMultiplier };
      case 'ritual_chamber':
        return { color: 0x1a0000, density: baseDensity * 2 * sanityMultiplier };
      default:
        return { color: 0x050302, density: baseDensity };
    }
  };
  
  const fogSettings = getFogSettings();
  
  return (
    <fog
      attach="fog"
      args={[fogSettings.color, 0.1, 50 / fogSettings.density]}
    />
  );
}

// Game Scene Component
function GameScene() {
  const isGameActive = useGameStore((state) => state.isGameActive);
  const graphicsSettings = useGameStore((state) => state.graphicsSettings);
  
  return (
    <>
      {/* Background Color */}
      <color attach="background" args={['#020101']} />
      
      {/* Environment Fog */}
      <EnvironmentFog />
      
      {/* Lighting */}
      <Lighting />
      
      {/* Flashlight */}
      <Flashlight />
      
      {/* World */}
      <World />
      
      {/* Enemy Manager */}
      <EnemyManager />
      
      {/* Particle System */}
      <ParticleSystem />
      
      {/* Player Controller */}
      <PlayerController />
      
      {/* Camera Controller */}
      <CameraController />
      
      {/* Post Processing */}
      {graphicsSettings.postProcessing && isGameActive && (
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.95}
            luminanceSmoothing={0.4}
            height={300}
          />
          <SanityEffects />
        </EffectComposer>
      )}
    </>
  );
}

// Main Game Canvas Component
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { initAudio, playAmbient } = useAudioSystem();
  
  const isGameActive = useGameStore((state) => state.isGameActive);
  const graphicsSettings = useGameStore((state) => state.graphicsSettings);

  useEffect(() => {
    if (isGameActive) {
      initAudio();
      playAmbient('church_ambient');
    }
  }, [isGameActive, initAudio, playAmbient]);

  const getPixelRatio = () => {
    switch (graphicsSettings.quality) {
      case 'low': return 0.5;
      case 'medium': return 0.75;
      case 'high': return 1;
      case 'ultra': return Math.min(window.devicePixelRatio, 2);
      default: return 1;
    }
  };

  return (
    <Canvas
      ref={canvasRef}
      camera={{
        fov: graphicsSettings.fov,
        near: 0.05,
        far: 120,
        position: [0, 1.7, 18]
      }}
      gl={{
        antialias: graphicsSettings.quality !== 'low',
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      }}
      dpr={getPixelRatio()}
      shadows={graphicsSettings.shadows}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1
      }}
    >
      <GameScene />
    </Canvas>
  );
}
