import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';

// Ambient Light Component
function AmbientLighting() {
  const sanity = useGameStore((state) => state.player.sanity);
  
  // Dim ambient light that decreases with sanity
  const intensity = 0.1 * (sanity / 100);
  
  return (
    <ambientLight 
      color={0xffecd0} 
      intensity={intensity} 
    />
  );
}

// Moon Light Component (Directional)
function MoonLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const shadowCameraRef = useRef<THREE.OrthographicCamera>(null);
  
  useEffect(() => {
    if (lightRef.current && shadowCameraRef.current) {
      lightRef.current.shadow.camera = shadowCameraRef.current;
    }
  }, []);

  return (
    <>
      <directionalLight
        ref={lightRef}
        color={0xaaddee}
        intensity={0.25}
        position={[0, 20, 10]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
    </>
  );
}

// Sconce Light Component (Wall Torches)
function SconceLight({ 
  position, 
  intensity = 0.8,
  flicker = true 
}: { 
  position: [number, number, number];
  intensity?: number;
  flicker?: boolean;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const baseIntensity = useRef(intensity);
  
  useFrame(() => {
    if (lightRef.current && flicker) {
      // Random flicker effect
      const flickerAmount = 0.1;
      const flickerSpeed = 10;
      const noise = Math.sin(Date.now() * 0.001 * flickerSpeed) * 
                    Math.cos(Date.now() * 0.0013 * flickerSpeed) * flickerAmount;
      lightRef.current.intensity = baseIntensity.current + noise;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={0xff7722}
      intensity={intensity}
      distance={8}
      decay={1}
      castShadow
    />
  );
}

// Ritual Chamber Lights (Red ominous lighting)
function RitualLights() {
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);
  
  if (currentLevel !== 'ritual_chamber') return null;

  return (
    <>
      {/* Central red glow */}
      <pointLight
        position={[0, 5, -35]}
        color={0xff0000}
        intensity={3}
        distance={15}
        decay={2}
      />
      
      {/* Pulsing altar light */}
      <PulsingLight 
        position={[0, 3, -35]}
        color={0x8b0000}
        baseIntensity={2}
        pulseSpeed={2}
      />
    </>
  );
}

// Pulsing Light Component
function PulsingLight({
  position,
  color,
  baseIntensity,
  pulseSpeed
}: {
  position: [number, number, number];
  color: number;
  baseIntensity: number;
  pulseSpeed: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame(() => {
    if (lightRef.current) {
      const pulse = Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.5 + 0.5;
      lightRef.current.intensity = baseIntensity * (0.5 + pulse * 0.5);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={baseIntensity}
      distance={10}
      decay={2}
    />
  );
}

// Sanity-based Horror Lighting
function SanityLighting() {
  const sanity = useGameStore((state) => state.player.sanity);
  
  if (sanity > 50) return null;
  
  const intensity = (50 - sanity) / 50 * 0.5;
  
  // Add subtle red tint when sanity is low
  return (
    <hemisphereLight
      color={0x000000}
      groundColor={0x330000}
      intensity={intensity}
    />
  );
}

// Dynamic Shadows Controller
function ShadowController() {
  const graphicsSettings = useGameStore((state) => state.graphicsSettings);
  
  useEffect(() => {
    // Update shadow quality based on settings
    const _shadowMapSize = graphicsSettings.quality === 'ultra' ? 2048 :
                          graphicsSettings.quality === 'high' ? 1024 :
                          graphicsSettings.quality === 'medium' ? 512 : 256;
    
    // This would be applied to all lights with shadows
    void _shadowMapSize;
  }, [graphicsSettings]);

  return null;
}

// Main Lighting Component
export default function Lighting() {
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);

  // Generate sconce positions based on level
  const getSconcePositions = (): [number, number, number][] => {
    switch (currentLevel) {
      case 'church_entrance':
        return [
          [-14, 5, 20],
          [14, 5, 20],
          [-14, 5, 10],
          [14, 5, 10]
        ];
      case 'church_interior':
        return [
          [-14, 5, 0],
          [14, 5, 0],
          [-14, 5, -10],
          [14, 5, -10],
          [-14, 5, -20],
          [14, 5, -20]
        ];
      case 'catacombs':
        return [
          [-9, 4, -20],
          [9, 4, -20],
          [-9, 4, -30],
          [9, 4, -30]
        ];
      default:
        return [];
    }
  };

  const sconcePositions = getSconcePositions();

  return (
    <>
      {/* Ambient Light */}
      <AmbientLighting />
      
      {/* Moon Light */}
      <MoonLight />
      
      {/* Wall Sconces */}
      {sconcePositions.map((position, index) => (
        <SconceLight
          key={`sconce-${index}`}
          position={position}
          intensity={0.8}
          flicker={true}
        />
      ))}
      
      {/* Ritual Chamber Special Lighting */}
      <RitualLights />
      
      {/* Sanity-based Horror Effects */}
      <SanityLighting />
      
      {/* Shadow Quality Controller */}
      <ShadowController />
    </>
  );
}
