import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

// Dust Particles Component
function DustParticles({ count = 100 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const particles = useRef<Particle[]>([]);
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    particles.current = [];
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          Math.random() * 8,
          (Math.random() - 0.5) * 60
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.01
        ),
        life: Math.random() * 10,
        maxLife: 10 + Math.random() * 10,
        size: 0.02 + Math.random() * 0.03,
        color: new THREE.Color(0.8, 0.7, 0.5)
      };
      
      particles.current.push(particle);
      
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;
      
    }
    
    return { positions, colors };
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const positionArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    particles.current.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);
      particle.life += delta;
      
      // Reset particle if life exceeded
      if (particle.life > particle.maxLife) {
        particle.position.set(
          (Math.random() - 0.5) * 40,
          Math.random() * 8,
          (Math.random() - 0.5) * 60
        );
        particle.life = 0;
      }
      
      // Add subtle drift
      particle.velocity.x += (Math.random() - 0.5) * 0.0001;
      particle.velocity.z += (Math.random() - 0.5) * 0.0001;
      
      // Update array
      positionArray[i * 3] = particle.position.x;
      positionArray[i * 3 + 1] = particle.position.y;
      positionArray[i * 3 + 2] = particle.position.z;
    });
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Fire/Ember Particles Component
function EmberParticles({ 
  position, 
  count = 50 
}: { 
  position: [number, number, number];
  count?: number;
}) {
  const meshRef = useRef<THREE.Points>(null);
  const particles = useRef<Particle[]>([]);
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    particles.current = [];
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 2,
          position[1] + Math.random() * 2,
          position[2] + (Math.random() - 0.5) * 2
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.02 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random() * 3,
        maxLife: 2 + Math.random() * 2,
        size: 0.05 + Math.random() * 0.05,
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5)
      };
      
      particles.current.push(particle);
      
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;
    }
    
    return { positions, colors };
  }, [count, position]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const positionArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const colorArray = meshRef.current.geometry.attributes.color.array as Float32Array;
    
    particles.current.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);
      particle.life += delta;
      
      // Reset particle if life exceeded
      if (particle.life > particle.maxLife) {
        particle.position.set(
          position[0] + (Math.random() - 0.5) * 2,
          position[1],
          position[2] + (Math.random() - 0.5) * 2
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 0.02,
          0.02 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        );
        particle.life = 0;
        
        // Reset color
        const hue = 0.05 + Math.random() * 0.1;
        particle.color.setHSL(hue, 1, 0.5);
      }
      
      // Fade color based on life
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      particle.color.setHSL(0.05 + lifeRatio * 0.1, 1, 0.5 * lifeRatio);
      
      // Update arrays
      positionArray[i * 3] = particle.position.x;
      positionArray[i * 3 + 1] = particle.position.y;
      positionArray[i * 3 + 2] = particle.position.z;
      
      colorArray[i * 3] = particle.color.r;
      colorArray[i * 3 + 1] = particle.color.g;
      colorArray[i * 3 + 2] = particle.color.b;
    });
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Fog/Mist Particles Component
function MistParticles({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const particles = useRef<Particle[]>([]);
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    particles.current = [];
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 50,
          Math.random() * 3,
          (Math.random() - 0.5) * 70
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random() * 20,
        maxLife: 15 + Math.random() * 10,
        size: 0.5 + Math.random() * 1,
        color: new THREE.Color(0.3, 0.3, 0.35)
      };
      
      particles.current.push(particle);
      
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;
    }
    
    return { positions, colors };
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const positionArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    particles.current.forEach((particle, i) => {
      // Update position
      particle.position.add(particle.velocity);
      particle.life += delta;
      
      // Reset particle
      if (particle.life > particle.maxLife) {
        particle.position.set(
          (Math.random() - 0.5) * 50,
          Math.random() * 3,
          (Math.random() - 0.5) * 70
        );
        particle.life = 0;
      }
      
      // Slow drift
      particle.velocity.x += (Math.random() - 0.5) * 0.0005;
      particle.velocity.z += (Math.random() - 0.5) * 0.0005;
      
      // Dampen velocity
      particle.velocity.multiplyScalar(0.99);
      
      // Update array
      positionArray[i * 3] = particle.position.x;
      positionArray[i * 3 + 1] = particle.position.y;
      positionArray[i * 3 + 2] = particle.position.z;
    });
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Only show mist in certain areas
  if (currentLevel === 'ritual_chamber') return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        vertexColors
        transparent
        opacity={0.15}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Spirit/Ectoplasm Particles (for ghost areas)
function SpiritParticles({ 
  position, 
  count = 30 
}: { 
  position: [number, number, number];
  count?: number;
}) {
  const meshRef = useRef<THREE.Points>(null);
  const particles = useRef<Particle[]>([]);
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    particles.current = [];
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 3,
          position[1] + Math.random() * 3,
          position[2] + (Math.random() - 0.5) * 3
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          0.005 + Math.random() * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        life: Math.random() * 5,
        maxLife: 3 + Math.random() * 3,
        size: 0.1 + Math.random() * 0.2,
        color: new THREE.Color(0.4, 0.8, 1)
      };
      
      particles.current.push(particle);
      
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;
    }
    
    return { positions, colors };
  }, [count, position]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const positionArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const colorArray = meshRef.current.geometry.attributes.color.array as Float32Array;
    
    particles.current.forEach((particle, i) => {
      particle.position.add(particle.velocity);
      particle.life += delta;
      
      // Spiral motion
      const time = Date.now() * 0.001;
      particle.position.x += Math.sin(time + i) * 0.002;
      particle.position.z += Math.cos(time + i) * 0.002;
      
      if (particle.life > particle.maxLife) {
        particle.position.set(
          position[0] + (Math.random() - 0.5) * 3,
          position[1],
          position[2] + (Math.random() - 0.5) * 3
        );
        particle.life = 0;
      }
      
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      particle.color.setRGB(0.4 * lifeRatio, 0.8 * lifeRatio, 1 * lifeRatio);
      
      positionArray[i * 3] = particle.position.x;
      positionArray[i * 3 + 1] = particle.position.y;
      positionArray[i * 3 + 2] = particle.position.z;
      
      colorArray[i * 3] = particle.color.r;
      colorArray[i * 3 + 1] = particle.color.g;
      colorArray[i * 3 + 2] = particle.color.b;
    });
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Main Particle System
export default function ParticleSystem() {
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);
  const sanity = useGameStore((state) => state.player.sanity);
  
  // Increase particle effects when sanity is low
  const dustCount = 50 + Math.floor((100 - sanity) / 2);
  const mistCount = 100 + (100 - sanity) * 2;

  return (
    <>
      {/* Always present dust particles */}
      <DustParticles count={dustCount} />
      
      {/* Mist/Fog particles */}
      <MistParticles count={mistCount} />
      
      {/* Level-specific particles */}
      {currentLevel === 'ritual_chamber' && (
        <>
          <EmberParticles position={[0, 0.5, -35]} count={100} />
          <SpiritParticles position={[0, 2, -35]} count={50} />
        </>
      )}
      
      {/* Spirit particles near ghosts */}
      {currentLevel === 'church_interior' && (
        <SpiritParticles position={[5, 1, -10]} count={30} />
      )}
      
      {currentLevel === 'catacombs' && (
        <>
          <SpiritParticles position={[0, 1, -25]} count={40} />
          <MistParticles count={150} />
        </>
      )}
    </>
  );
}
