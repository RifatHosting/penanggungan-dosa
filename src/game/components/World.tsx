import { useEffect, useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';

// Texture URLs from free CDN sources
const TEXTURES = {
  stone: {
    diffuse: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg',
    bump: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_bump.jpg',
    roughness: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_roughness.jpg'
  },
  wood: {
    diffuse: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg',
    normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Normal.jpg'
  },
  fabric: {
    bump: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_bump.jpg'
  }
};

// Wall Component
function Wall({ 
  position, 
  size, 
  material,
  collidable = true 
}: { 
  position: [number, number, number];
  size: [number, number, number];
  material: THREE.Material;
  collidable?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current && collidable) {
      meshRef.current.userData.collidable = true;
      meshRef.current.userData.collisionBox = {
        minX: position[0] - size[0] / 2,
        maxX: position[0] + size[0] / 2,
        minY: position[1] - size[1] / 2,
        maxY: position[1] + size[1] / 2,
        minZ: position[2] - size[2] / 2,
        maxZ: position[2] + size[2] / 2
      };
    }
  }, [position, size, collidable]);

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={size} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Floor Component
function Floor({ 
  position, 
  size, 
  material 
}: { 
  position: [number, number, number];
  size: [number, number];
  material: THREE.Material;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Ceiling Component
function Ceiling({ 
  position, 
  size, 
  material 
}: { 
  position: [number, number, number];
  size: [number, number];
  material: THREE.Material;
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Pillar Component
function Pillar({ 
  position, 
  height, 
  material 
}: { 
  position: [number, number, number];
  height: number;
  material: THREE.Material;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.collidable = true;
      meshRef.current.userData.collisionBox = {
        minX: position[0] - 0.75,
        maxX: position[0] + 0.75,
        minY: position[1] - height / 2,
        maxY: position[1] + height / 2,
        minZ: position[2] - 0.75,
        maxZ: position[2] + 0.75
      };
    }
  }, [position, height]);

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[1.5, height, 1.5]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Pew (Church Bench) Component
function Pew({ position, rotation }: { position: [number, number, number]; rotation?: number }) {
  const woodMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x30180a,
      roughness: 0.9
    });
    return mat;
  }, []);

  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 1.2, 0.8]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1.5, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[6.1, 1.2, 0.1]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
    </group>
  );
}

// Altar Component
function Altar({ position }: { position: [number, number, number] }) {
  const altarMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xaa2222,
      roughness: 1,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });
  }, []);

  return (
    <group position={position}>
      {/* Altar Table */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 1.3, 2]} />
        <primitive object={altarMaterial} attach="material" />
      </mesh>
      {/* Cross */}
      <mesh position={[0, 3, -1]} castShadow>
        <boxGeometry args={[0.5, 3.5, 0.5]} />
        <meshStandardMaterial color={0x1a0a05} roughness={1} />
      </mesh>
      <mesh position={[0, 4, -1]} castShadow>
        <boxGeometry args={[2, 0.4, 0.5]} />
        <meshStandardMaterial color={0x1a0a05} roughness={1} />
      </mesh>
    </group>
  );
}

// Interactive Object Component
function InteractiveObject({
  id,
  position,
  type,
  onInteract
}: {
  id: string;
  position: [number, number, number];
  type: 'document' | 'key' | 'item' | 'door';
  onInteract?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  const interactWithObject = useGameStore((state) => state.interactWithObject);

  useFrame(() => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.05;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleClick = () => {
    interactWithObject(id);
    onInteract?.();
  };

  const getGeometry = () => {
    switch (type) {
      case 'document':
        return <planeGeometry args={[0.5, 0.4]} />;
      case 'key':
        return <boxGeometry args={[0.3, 0.1, 0.1]} />;
      case 'item':
        return <boxGeometry args={[0.4, 0.4, 0.4]} />;
      case 'door':
        return <boxGeometry args={[2, 3, 0.2]} />;
      default:
        return <boxGeometry args={[0.4, 0.4, 0.4]} />;
    }
  };

  const getMaterialColor = () => {
    switch (type) {
      case 'document':
        return 0xffffaa;
      case 'key':
        return 0xffd700;
      case 'item':
        return 0x00ff00;
      case 'door':
        return 0x4a3728;
      default:
        return 0xffffff;
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        userData={{ interactive: true, id, type }}
      >
        {getGeometry()}
        <meshStandardMaterial 
          color={getMaterialColor()} 
          side={type === 'document' ? THREE.DoubleSide : THREE.FrontSide}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[position[0], position[1] + 0.5, position[2]]}
        color={type === 'document' ? 0xffffaa : type === 'key' ? 0xffd700 : 0x00ff00}
        intensity={1}
        distance={3}
        decay={2}
      />
    </group>
  );
}

// Main World Component
export default function World() {
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);
  
  // Load textures
  const [stoneDiffuse, stoneBump, stoneRoughness, woodDiffuse, woodNormal] = useLoader(
    THREE.TextureLoader,
    [
      TEXTURES.stone.diffuse,
      TEXTURES.stone.bump,
      TEXTURES.stone.roughness,
      TEXTURES.wood.diffuse,
      TEXTURES.wood.normal
    ]
  );

  // Configure textures
  useEffect(() => {
    [stoneDiffuse, stoneBump, stoneRoughness, woodDiffuse, woodNormal].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
    
    stoneDiffuse.repeat.set(3, 3);
    stoneBump.repeat.set(3, 3);
    stoneRoughness.repeat.set(3, 3);
    woodDiffuse.repeat.set(5, 5);
    woodNormal.repeat.set(5, 5);
  }, [stoneDiffuse, stoneBump, stoneRoughness, woodDiffuse, woodNormal]);

  // Materials
  const wallMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: stoneDiffuse,
      bumpMap: stoneBump,
      roughnessMap: stoneRoughness,
      color: 0x5a4a40,
      roughness: 0.8,
      metalness: 0.1
    });
    return mat;
  }, [stoneDiffuse, stoneBump, stoneRoughness]);

  const floorMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: woodDiffuse,
      normalMap: woodNormal,
      color: 0x332822,
      roughness: 0.25,
      metalness: 0.35
    });
    return mat;
  }, [woodDiffuse, woodNormal]);

  const ceilingMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x080806,
      roughness: 1
    });
    return mat;
  }, []);

  // Render different levels
  const renderLevel = () => {
    switch (currentLevel) {
      case 'church_entrance':
        return (
          <>
            {/* Floor */}
            <Floor position={[0, 0, 0]} size={[40, 60]} material={floorMaterial} />
            
            {/* Walls */}
            <Wall position={[0, 5, 25]} size={[40, 10, 1.5]} material={wallMaterial} />
            <Wall position={[0, 5, -30]} size={[40, 10, 1.5]} material={wallMaterial} />
            <Wall position={[-15, 5, -2]} size={[1.5, 10, 60]} material={wallMaterial} />
            <Wall position={[15, 5, -2]} size={[1.5, 10, 60]} material={wallMaterial} />
            
            {/* Ceiling */}
            <Ceiling position={[0, 9, -2]} size={[32, 60]} material={ceilingMaterial} />
            
            {/* Entrance Gate */}
            <Wall position={[0, 5, 23]} size={[8, 8, 0.5]} material={wallMaterial} />
            
            {/* Interactive Document */}
            <InteractiveObject
              id="doc_entrance"
              position={[2, 1, 20]}
              type="document"
            />
          </>
        );
      
      case 'church_interior':
        return (
          <>
            {/* Floor */}
            <Floor position={[0, 0, -15]} size={[30, 40]} material={floorMaterial} />
            
            {/* Pillars */}
            {Array.from({ length: 6 }, (_, i) => (
              <group key={i}>
                <Pillar 
                  position={[-9, 4.5, 15 - i * 8]} 
                  height={9} 
                  material={wallMaterial} 
                />
                <Pillar 
                  position={[9, 4.5, 15 - i * 8]} 
                  height={9} 
                  material={wallMaterial} 
                />
              </group>
            ))}
            
            {/* Pews */}
            {Array.from({ length: 9 }, (_, i) => (
              <group key={`pew-${i}`}>
                <Pew position={[-4, 0, 12 - i * 3.5]} />
                <Pew position={[4, 0, 12 - i * 3.5]} />
              </group>
            ))}
            
            {/* Interactive Items */}
            <InteractiveObject
              id="doc_interior"
              position={[-2, 1.35, 1.2]}
              type="document"
            />
          </>
        );
      
      case 'catacombs':
        return (
          <>
            {/* Floor */}
            <Floor position={[0, 0, -25]} size={[25, 30]} material={floorMaterial} />
            
            {/* Narrow Walls */}
            <Wall position={[-10, 5, -25]} size={[1, 10, 30]} material={wallMaterial} />
            <Wall position={[10, 5, -25]} size={[1, 10, 30]} material={wallMaterial} />
            
            {/* Tombstones */}
            {Array.from({ length: 8 }, (_, i) => (
              <mesh 
                key={`tomb-${i}`}
                position={[-6 + (i % 2) * 12, 0.5, -15 - Math.floor(i / 2) * 5]}
                castShadow
              >
                <boxGeometry args={[1, 1, 0.3]} />
                <meshStandardMaterial color={0x4a4a4a} roughness={0.9} />
              </mesh>
            ))}
            
            {/* Key Item */}
            <InteractiveObject
              id="key_catacombs"
              position={[0, 1, -25]}
              type="key"
            />
          </>
        );
      
      case 'ritual_chamber':
        return (
          <>
            {/* Floor with pentagram */}
            <Floor position={[0, 0, -35]} size={[20, 20]} material={floorMaterial} />
            
            {/* Altar */}
            <Altar position={[0, 0, -35]} />
            
            {/* Candles around altar */}
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const x = Math.cos(angle) * 6;
              const z = Math.sin(angle) * 6 - 35;
              return (
                <group key={`candle-${i}`}>
                  <mesh position={[x, 0.3, z]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                    <meshStandardMaterial color={0x8b4513} />
                  </mesh>
                  <pointLight
                    position={[x, 0.8, z]}
                    color={0xff6600}
                    intensity={2}
                    distance={4}
                    decay={2}
                  />
                </group>
              );
            })}
            
            {/* Final Document */}
            <InteractiveObject
              id="doc_final"
              position={[0, 1.5, -34]}
              type="document"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <group>
      {renderLevel()}
    </group>
  );
}
