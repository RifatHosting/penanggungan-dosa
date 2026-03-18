import { Vector3, Euler } from 'three';

export interface PlayerState {
  position: Vector3;
  rotation: Euler;
  velocity: Vector3;
  health: number;
  sanity: number;
  stamina: number;
  isSprinting: boolean;
  isCrouching: boolean;
  isFlashlightOn: boolean;
}

export interface EnemyState {
  id: string;
  type: string;
  position: Vector3;
  rotation: Euler;
  health: number;
  state: string;
  targetPosition?: Vector3;
  lastKnownPlayerPosition?: Vector3;
  patrolPath?: Vector3[];
  currentPatrolIndex: number;
  detectionLevel: number;
  isAlerted: boolean;
}

export const EnemyType = {
  GHOST: 'ghost',
  DEMON: 'demon',
  POSSESSED: 'possessed',
  SHADOW: 'shadow',
  BOSS: 'boss'
} as const;

export const EnemyBehaviorState = {
  IDLE: 'idle',
  PATROL: 'patrol',
  INVESTIGATE: 'investigate',
  CHASE: 'chase',
  ATTACK: 'attack',
  STUNNED: 'stunned',
  DEAD: 'dead'
} as const;

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  icon: string;
  description: string;
  usable: boolean;
  metadata?: Record<string, any>;
}

export const ItemType = {
  WEAPON: 'weapon',
  CONSUMABLE: 'consumable',
  KEY: 'key',
  DOCUMENT: 'document',
  TOOL: 'tool',
  MISC: 'misc'
} as const;

export interface GameState {
  currentLevel: string;
  checkpoint: string;
  objective: string;
  storyProgress: number;
  unlockedAreas: string[];
  completedPuzzles: string[];
  triggeredEvents: string[];
}

export interface WorldObject {
  id: string;
  type: string;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  interacted: boolean;
  state: Record<string, any>;
}

export interface DoorState {
  id: string;
  isOpen: boolean;
  isLocked: boolean;
  requiredKey?: string;
  canBeBroken: boolean;
}

export interface SaveData {
  gameState: GameState;
  playerStats: {
    health: number;
    sanity: number;
    stamina: number;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  };
  inventory: InventoryItem[];
  equipment: {
    flashlight: {
      has: boolean;
      battery: number;
      enabled: boolean;
    };
    weapon?: {
      id: string;
      ammo: number;
    };
  };
  collectibles: {
    documents: string[];
    photos: string[];
    artifacts: string[];
  };
  worldState: {
    enemyPositions: EnemyState[];
    interactableStates: WorldObject[];
    doorStates: DoorState[];
  };
  difficulty: string;
  playTime: number;
}

export const Difficulty = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
  NIGHTMARE: 'nightmare'
} as const;

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
}

export interface GraphicsSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  shadows: boolean;
  postProcessing: boolean;
  fov: number;
  resolution: string;
}

export interface ControlSettings {
  mouseSensitivity: number;
  invertY: boolean;
  keybindings: Record<string, string>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface MultiplayerPlayer {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  health: number;
  sanity: number;
  isReady: boolean;
}

export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}
