import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Vector3, Euler } from 'three';
import type {
  PlayerState,
  EnemyState,
  InventoryItem,
  GameState,
  WorldObject,
  DoorState,
  SaveData,
  AudioSettings,
  GraphicsSettings,
  ControlSettings,
  Achievement
} from '../game/types';
import { EnemyBehaviorState, Difficulty } from '../game/types';

interface GameStore {
  // Game Status
  isGameActive: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentScene: 'menu' | 'cutscene' | 'game' | 'gameover' | 'victory';
  
  // Player
  player: PlayerState;
  
  // Enemies
  enemies: EnemyState[];
  
  // Game State
  gameState: GameState;
  
  // Inventory
  inventory: InventoryItem[];
  equipment: {
    flashlight: {
      has: boolean;
      battery: number;
      enabled: boolean;
      maxBattery: number;
    };
    weapon?: {
      id: string;
      ammo: number;
      maxAmmo?: number;
    };
  };
  
  // World
  worldObjects: WorldObject[];
  doors: DoorState[];
  
  // Settings
  difficulty: string;
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  controlSettings: ControlSettings;
  
  // Stats
  playTime: number;
  deaths: number;
  collectiblesFound: number;
  achievements: Achievement[];
  
  // Multiplayer
  isMultiplayer: boolean;
  roomId: string | null;
  otherPlayers: Map<string, any>;
  
  // Actions
  setGameActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCurrentScene: (scene: 'menu' | 'cutscene' | 'game' | 'gameover' | 'victory') => void;
  
  // Player Actions
  updatePlayerPosition: (position: Vector3) => void;
  updatePlayerRotation: (rotation: Euler) => void;
  updatePlayerVelocity: (velocity: Vector3) => void;
  updatePlayerHealth: (health: number) => void;
  updatePlayerSanity: (sanity: number) => void;
  updatePlayerStamina: (stamina: number) => void;
  setPlayerSprinting: (sprinting: boolean) => void;
  setPlayerCrouching: (crouching: boolean) => void;
  toggleFlashlight: () => void;
  drainFlashlightBattery: (amount: number) => void;
  rechargeFlashlightBattery: (amount: number) => void;
  
  // Enemy Actions
  spawnEnemy: (enemy: EnemyState) => void;
  updateEnemy: (id: string, updates: Partial<EnemyState>) => void;
  removeEnemy: (id: string) => void;
  setEnemyState: (id: string, state: string) => void;
  damageEnemy: (id: string, damage: number) => void;
  
  // Inventory Actions
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string, quantity?: number) => void;
  useItem: (id: string) => void;
  equipWeapon: (weaponId: string) => void;
  
  // Game State Actions
  updateGameState: (updates: Partial<GameState>) => void;
  unlockArea: (areaId: string) => void;
  completePuzzle: (puzzleId: string) => void;
  triggerEvent: (eventId: string) => void;
  
  // World Actions
  interactWithObject: (id: string) => void;
  toggleDoor: (id: string) => void;
  unlockDoor: (id: string) => void;
  
  // Settings Actions
  setDifficulty: (difficulty: string) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  updateGraphicsSettings: (settings: Partial<GraphicsSettings>) => void;
  updateControlSettings: (settings: Partial<ControlSettings>) => void;
  
  // Save/Load
  getSaveData: () => SaveData;
  loadSaveData: (data: SaveData) => void;
  resetGame: () => void;
  
  // Multiplayer
  setMultiplayer: (isMultiplayer: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  updateOtherPlayer: (id: string, data: any) => void;
  removeOtherPlayer: (id: string) => void;
}

const initialPlayerState: PlayerState = {
  position: new Vector3(0, 1.7, 18),
  rotation: new Euler(0, 0, 0),
  velocity: new Vector3(0, 0, 0),
  health: 100,
  sanity: 100,
  stamina: 100,
  isSprinting: false,
  isCrouching: false,
  isFlashlightOn: true
};

const initialGameState: GameState = {
  currentLevel: 'church_entrance',
  checkpoint: 'start',
  objective: 'Masuk ke Gereja Tua',
  storyProgress: 0,
  unlockedAreas: [],
  completedPuzzles: [],
  triggeredEvents: []
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    isGameActive: false,
    isPaused: false,
    isLoading: true,
    currentScene: 'menu',
    
    player: { ...initialPlayerState },
    enemies: [],
    gameState: { ...initialGameState },
    inventory: [],
    equipment: {
      flashlight: {
        has: true,
        battery: 100,
        enabled: true,
        maxBattery: 100
      }
    },
    worldObjects: [],
    doors: [],
    
    difficulty: Difficulty.NORMAL,
    audioSettings: {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 1.0,
      voiceVolume: 1.0
    },
    graphicsSettings: {
      quality: 'high',
      shadows: true,
      postProcessing: true,
      fov: 70,
      resolution: '1920x1080'
    },
    controlSettings: {
      mouseSensitivity: 0.0022,
      invertY: false,
      keybindings: {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        sprint: 'ShiftLeft',
        interact: 'KeyE',
        flashlight: 'KeyF',
        inventory: 'KeyI',
        pause: 'Escape'
      }
    },
    
    playTime: 0,
    deaths: 0,
    collectiblesFound: 0,
    achievements: [],
    
    isMultiplayer: false,
    roomId: null,
    otherPlayers: new Map(),
    
    // Actions
    setGameActive: (active) => set({ isGameActive: active }),
    setPaused: (paused) => set({ isPaused: paused }),
    setLoading: (loading) => set({ isLoading: loading }),
    setCurrentScene: (scene) => set({ currentScene: scene }),
    
    // Player Actions
    updatePlayerPosition: (position) => set((state) => ({
      player: { ...state.player, position }
    })),
    
    updatePlayerRotation: (rotation) => set((state) => ({
      player: { ...state.player, rotation }
    })),
    
    updatePlayerVelocity: (velocity) => set((state) => ({
      player: { ...state.player, velocity }
    })),
    
    updatePlayerHealth: (health) => set((state) => ({
      player: { ...state.player, health: Math.max(0, Math.min(100, health)) }
    })),
    
    updatePlayerSanity: (sanity) => set((state) => ({
      player: { ...state.player, sanity: Math.max(0, Math.min(100, sanity)) }
    })),
    
    updatePlayerStamina: (stamina) => set((state) => ({
      player: { ...state.player, stamina: Math.max(0, Math.min(100, stamina)) }
    })),
    
    setPlayerSprinting: (sprinting) => set((state) => ({
      player: { ...state.player, isSprinting: sprinting }
    })),
    
    setPlayerCrouching: (crouching) => set((state) => ({
      player: { ...state.player, isCrouching: crouching }
    })),
    
    toggleFlashlight: () => set((state) => {
      if (state.equipment.flashlight.battery <= 0) return state;
      return {
        equipment: {
          ...state.equipment,
          flashlight: {
            ...state.equipment.flashlight,
            enabled: !state.equipment.flashlight.enabled
          }
        }
      };
    }),
    
    drainFlashlightBattery: (amount) => set((state) => ({
      equipment: {
        ...state.equipment,
        flashlight: {
          ...state.equipment.flashlight,
          battery: Math.max(0, state.equipment.flashlight.battery - amount),
          enabled: state.equipment.flashlight.battery - amount > 0 ? state.equipment.flashlight.enabled : false
        }
      }
    })),
    
    rechargeFlashlightBattery: (amount) => set((state) => ({
      equipment: {
        ...state.equipment,
        flashlight: {
          ...state.equipment.flashlight,
          battery: Math.min(state.equipment.flashlight.maxBattery, state.equipment.flashlight.battery + amount)
        }
      }
    })),
    
    // Enemy Actions
    spawnEnemy: (enemy) => set((state) => ({
      enemies: [...state.enemies, enemy]
    })),
    
    updateEnemy: (id, updates) => set((state) => ({
      enemies: state.enemies.map(e => e.id === id ? { ...e, ...updates } : e)
    })),
    
    removeEnemy: (id) => set((state) => ({
      enemies: state.enemies.filter(e => e.id !== id)
    })),
    
    setEnemyState: (id, state) => set((prevState) => ({
      enemies: prevState.enemies.map(e => e.id === id ? { ...e, state } : e)
    })),
    
    damageEnemy: (id, damage) => set((state) => ({
      enemies: state.enemies.map(e => {
        if (e.id !== id) return e;
        const newHealth = e.health - damage;
        return {
          ...e,
          health: newHealth,
          state: newHealth <= 0 ? EnemyBehaviorState.DEAD : e.state
        };
      })
    })),
    
    // Inventory Actions
    addItem: (item) => set((state) => {
      const existingItem = state.inventory.find(i => i.id === item.id);
      if (existingItem) {
        return {
          inventory: state.inventory.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          )
        };
      }
      return { inventory: [...state.inventory, item] };
    }),
    
    removeItem: (id, quantity = 1) => set((state) => {
      const item = state.inventory.find(i => i.id === id);
      if (!item) return state;
      
      if (item.quantity <= quantity) {
        return { inventory: state.inventory.filter(i => i.id !== id) };
      }
      
      return {
        inventory: state.inventory.map(i =>
          i.id === id ? { ...i, quantity: i.quantity - quantity } : i
        )
      };
    }),
    
    useItem: (id) => set((state) => {
      const item = state.inventory.find(i => i.id === id);
      if (!item || !item.usable) return state;
      
      // Apply item effects based on type
      if (item.type === 'consumable') {
        if (item.metadata?.healthRestore) {
          get().updatePlayerHealth(state.player.health + item.metadata.healthRestore);
        }
        if (item.metadata?.sanityRestore) {
          get().updatePlayerSanity(state.player.sanity + item.metadata.sanityRestore);
        }
        if (item.metadata?.batteryRestore) {
          get().rechargeFlashlightBattery(item.metadata.batteryRestore);
        }
      }
      
      return {
        inventory: state.inventory.map(i =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        ).filter(i => i.quantity > 0)
      };
    }),
    
    equipWeapon: (weaponId) => set((state) => {
      const weapon = state.inventory.find(i => i.id === weaponId && i.type === 'weapon');
      if (!weapon) return state;
      
      return {
        equipment: {
          ...state.equipment,
          weapon: {
            id: weaponId,
            ammo: weapon.metadata?.ammo || 0,
            maxAmmo: weapon.metadata?.maxAmmo || 10
          }
        }
      };
    }),
    
    // Game State Actions
    updateGameState: (updates) => set((state) => ({
      gameState: { ...state.gameState, ...updates }
    })),
    
    unlockArea: (areaId) => set((state) => ({
      gameState: {
        ...state.gameState,
        unlockedAreas: [...state.gameState.unlockedAreas, areaId]
      }
    })),
    
    completePuzzle: (puzzleId) => set((state) => ({
      gameState: {
        ...state.gameState,
        completedPuzzles: [...state.gameState.completedPuzzles, puzzleId]
      }
    })),
    
    triggerEvent: (eventId) => set((state) => ({
      gameState: {
        ...state.gameState,
        triggeredEvents: [...state.gameState.triggeredEvents, eventId]
      }
    })),
    
    // World Actions
    interactWithObject: (id) => set((state) => ({
      worldObjects: state.worldObjects.map(obj =>
        obj.id === id ? { ...obj, interacted: true } : obj
      )
    })),
    
    toggleDoor: (id) => set((state) => ({
      doors: state.doors.map(door =>
        door.id === id && !door.isLocked ? { ...door, isOpen: !door.isOpen } : door
      )
    })),
    
    unlockDoor: (id) => set((state) => ({
      doors: state.doors.map(door =>
        door.id === id ? { ...door, isLocked: false } : door
      )
    })),
    
    // Settings Actions
    setDifficulty: (difficulty) => set({ difficulty }),
    
    updateAudioSettings: (settings) => set((state) => ({
      audioSettings: { ...state.audioSettings, ...settings }
    })),
    
    updateGraphicsSettings: (settings) => set((state) => ({
      graphicsSettings: { ...state.graphicsSettings, ...settings }
    })),
    
    updateControlSettings: (settings) => set((state) => ({
      controlSettings: { ...state.controlSettings, ...settings }
    })),
    
    // Save/Load
    getSaveData: () => {
      const state = get();
      return {
        gameState: state.gameState,
        playerStats: {
          health: state.player.health,
          sanity: state.player.sanity,
          stamina: state.player.stamina,
          position: {
            x: state.player.position.x,
            y: state.player.position.y,
            z: state.player.position.z
          },
          rotation: {
            x: state.player.rotation.x,
            y: state.player.rotation.y,
            z: state.player.rotation.z
          }
        },
        inventory: state.inventory,
        equipment: state.equipment,
        collectibles: {
          documents: [],
          photos: [],
          artifacts: []
        },
        worldState: {
          enemyPositions: state.enemies,
          interactableStates: state.worldObjects,
          doorStates: state.doors
        },
        difficulty: state.difficulty,
        playTime: state.playTime
      };
    },
    
    loadSaveData: (data) => set((state) => ({
      gameState: data.gameState,
      player: {
        ...state.player,
        health: data.playerStats.health,
        sanity: data.playerStats.sanity,
        stamina: data.playerStats.stamina,
        position: new Vector3(
          data.playerStats.position.x,
          data.playerStats.position.y,
          data.playerStats.position.z
        ),
        rotation: new Euler(
          data.playerStats.rotation.x,
          data.playerStats.rotation.y,
          data.playerStats.rotation.z
        )
      },
      inventory: data.inventory,
      equipment: {
        flashlight: {
          has: data.equipment?.flashlight?.has ?? true,
          battery: data.equipment?.flashlight?.battery ?? 100,
          enabled: data.equipment?.flashlight?.enabled ?? true,
          maxBattery: 100
        },
        weapon: data.equipment?.weapon
      },
      enemies: data.worldState.enemyPositions,
      worldObjects: data.worldState.interactableStates,
      doors: data.worldState.doorStates,
      difficulty: data.difficulty,
      playTime: data.playTime
    })),
    
    resetGame: () => set({
      isGameActive: false,
      isPaused: false,
      currentScene: 'menu',
      player: { ...initialPlayerState },
      enemies: [],
      gameState: { ...initialGameState },
      inventory: [],
      equipment: {
        flashlight: {
          has: true,
          battery: 100,
          enabled: true,
          maxBattery: 100
        }
      },
      worldObjects: [],
      doors: [],
      playTime: 0
    }),
    
    // Multiplayer
    setMultiplayer: (isMultiplayer) => set({ isMultiplayer }),
    setRoomId: (roomId) => set({ roomId }),
    updateOtherPlayer: (id, data) => set((state) => {
      const newMap = new Map(state.otherPlayers);
      newMap.set(id, data);
      return { otherPlayers: newMap };
    }),
    removeOtherPlayer: (id) => set((state) => {
      const newMap = new Map(state.otherPlayers);
      newMap.delete(id);
      return { otherPlayers: newMap };
    })
  }))
);

export default useGameStore;
