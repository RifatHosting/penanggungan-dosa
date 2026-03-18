import { useState, useEffect, useCallback, useRef } from 'react';
import useGameStore from '../../store/gameStore';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  crouch: boolean;
  interact: boolean;
  flashlight: boolean;
  inventory: boolean;
  pause: boolean;
}

interface MouseState {
  movementX: number;
  movementY: number;
  isLocked: boolean;
}

export function useInputSystem() {
  const [keys, setKeys] = useState<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    interact: false,
    flashlight: false,
    inventory: false,
    pause: false
  });

  const [mouse, setMouse] = useState<MouseState>({
    movementX: 0,
    movementY: 0,
    isLocked: false
  });

  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);
  const setPaused = useGameStore((state) => state.setPaused);
  const toggleFlashlight = useGameStore((state) => state.toggleFlashlight);
  const controlSettings = useGameStore((state) => state.controlSettings);

  const mouseAccumulator = useRef({ x: 0, y: 0 });
  const lastKeyTime = useRef<Record<string, number>>({});

  // Key down handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameActive) return;

    const keybindings = controlSettings.keybindings;
    const now = Date.now();

    // Prevent rapid key repeats
    if (lastKeyTime.current[e.code] && now - lastKeyTime.current[e.code] < 100) {
      return;
    }
    lastKeyTime.current[e.code] = now;

    // Map key codes to actions
    switch (e.code) {
      case keybindings.forward:
        setKeys(prev => ({ ...prev, forward: true }));
        break;
      case keybindings.backward:
        setKeys(prev => ({ ...prev, backward: true }));
        break;
      case keybindings.left:
        setKeys(prev => ({ ...prev, left: true }));
        break;
      case keybindings.right:
        setKeys(prev => ({ ...prev, right: true }));
        break;
      case keybindings.sprint:
        setKeys(prev => ({ ...prev, sprint: true }));
        break;
      case 'ControlLeft':
      case 'ControlRight':
        setKeys(prev => ({ ...prev, crouch: true }));
        break;
      case keybindings.interact:
        setKeys(prev => ({ ...prev, interact: true }));
        break;
      case keybindings.flashlight:
        toggleFlashlight();
        break;
      case keybindings.inventory:
        setKeys(prev => ({ ...prev, inventory: true }));
        break;
      case keybindings.pause:
      case 'Escape':
        setPaused(!isPaused);
        if (!isPaused) {
          document.exitPointerLock();
        } else {
          document.body.requestPointerLock();
        }
        break;
    }
  }, [isGameActive, isPaused, controlSettings, setPaused, toggleFlashlight]);

  // Key up handler
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const keybindings = controlSettings.keybindings;

    switch (e.code) {
      case keybindings.forward:
        setKeys(prev => ({ ...prev, forward: false }));
        break;
      case keybindings.backward:
        setKeys(prev => ({ ...prev, backward: false }));
        break;
      case keybindings.left:
        setKeys(prev => ({ ...prev, left: false }));
        break;
      case keybindings.right:
        setKeys(prev => ({ ...prev, right: false }));
        break;
      case keybindings.sprint:
        setKeys(prev => ({ ...prev, sprint: false }));
        break;
      case 'ControlLeft':
      case 'ControlRight':
        setKeys(prev => ({ ...prev, crouch: false }));
        break;
      case keybindings.interact:
        setKeys(prev => ({ ...prev, interact: false }));
        break;
      case keybindings.inventory:
        setKeys(prev => ({ ...prev, inventory: false }));
        break;
    }
  }, [controlSettings]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isGameActive || isPaused) return;

    if (document.pointerLockElement === document.body) {
      mouseAccumulator.current.x += e.movementX;
      mouseAccumulator.current.y += e.movementY;
    }
  }, [isGameActive, isPaused]);

  // Pointer lock change handler
  const handlePointerLockChange = useCallback(() => {
    setMouse(prev => ({
      ...prev,
      isLocked: document.pointerLockElement === document.body
    }));

    if (document.pointerLockElement !== document.body && isGameActive && !isPaused) {
      setPaused(true);
    }
  }, [isGameActive, isPaused, setPaused]);

  // Mouse click handler for pointer lock
  const handleClick = useCallback(() => {
    if (isGameActive && !isPaused && document.pointerLockElement !== document.body) {
      document.body.requestPointerLock();
    }
  }, [isGameActive, isPaused]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleClick, handlePointerLockChange]);

  // Update mouse state from accumulator (called each frame)
  useEffect(() => {
    if (!isGameActive || isPaused) {
      setMouse(prev => ({ ...prev, movementX: 0, movementY: 0 }));
      return;
    }

    const interval = setInterval(() => {
      setMouse({
        movementX: mouseAccumulator.current.x,
        movementY: mouseAccumulator.current.y,
        isLocked: document.pointerLockElement === document.body
      });
      mouseAccumulator.current.x = 0;
      mouseAccumulator.current.y = 0;
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isGameActive, isPaused]);

  return {
    keys,
    mouse,
    isLocked: mouse.isLocked
  };
}

export default useInputSystem;
