import { useRef, useCallback, useEffect } from 'react';
import useGameStore from '../../store/gameStore';

// Audio URLs from free sources
const AUDIO_ASSETS = {
  // Ambient sounds
  ambient: {
    church_ambient: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_5e92e27d4d.mp3',
    wind_howl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_14ebf73602.mp3',
    dungeon_ambient: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_0b28c9c772.mp3',
    ritual_ambient: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3'
  },
  
  // SFX
  sfx: {
    // Footsteps
    footstep_concrete_1: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_149670dda5.mp3',
    footstep_concrete_2: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    footstep_concrete_3: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_cb0b7c6f0c.mp3',
    footstep_concrete_4: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    
    // UI
    ui_click: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    ui_hover: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    
    // Interactions
    door_open: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    door_creak: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    item_pickup: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    paper_rustle: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    flashlight_click: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    
    // Enemy
    enemy_alert: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    enemy_attack: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    enemy_death: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    ghost_whisper: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    
    // Horror
    heartbeat: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    breathing: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    scream: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    jump_scare: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3'
  },
  
  // Music
  music: {
    main_theme: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    tension: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    chase: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    boss_battle: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    victory: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3',
    game_over: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1531c.mp3'
  }
};

interface AudioOptions {
  volume?: number;
  pitch?: number;
  loop?: boolean;
  spatial?: boolean;
  position?: { x: number; y: number; z: number };
}

export function useAudioSystem() {
  const audioContext = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const ambientGain = useRef<GainNode | null>(null);
  const sfxGain = useRef<GainNode | null>(null);
  const musicGain = useRef<GainNode | null>(null);
  const activeSources = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const audioBuffers = useRef<Map<string, AudioBuffer>>(new Map());
  
  const audioSettings = useGameStore((state) => state.audioSettings);

  // Initialize audio context
  const initAudio = useCallback(async () => {
    if (audioContext.current) return;

    try {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain
      masterGain.current = audioContext.current.createGain();
      masterGain.current.gain.value = audioSettings.masterVolume;
      masterGain.current.connect(audioContext.current.destination);
      
      // Create category gains
      ambientGain.current = audioContext.current.createGain();
      ambientGain.current.gain.value = audioSettings.musicVolume;
      ambientGain.current.connect(masterGain.current);
      
      sfxGain.current = audioContext.current.createGain();
      sfxGain.current.gain.value = audioSettings.sfxVolume;
      sfxGain.current.connect(masterGain.current);
      
      musicGain.current = audioContext.current.createGain();
      musicGain.current.gain.value = audioSettings.musicVolume;
      musicGain.current.connect(masterGain.current);
      
      // Preload common sounds
      await preloadCommonSounds();
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }, [audioSettings]);

  // Preload common sounds
  const preloadCommonSounds = async () => {
    const soundsToPreload = [
      'footstep_concrete_1',
      'ui_click',
      'flashlight_click'
    ];
    
    for (const sound of soundsToPreload) {
      await loadSound(sound);
    }
  };

  // Load sound from URL
  const loadSound = async (soundName: string): Promise<AudioBuffer | null> => {
    if (audioBuffers.current.has(soundName)) {
      return audioBuffers.current.get(soundName)!;
    }

    if (!audioContext.current) return null;

    try {
      // Find sound URL
      let url: string | null = null;
      for (const category of Object.values(AUDIO_ASSETS)) {
        if (soundName in category) {
          url = category[soundName as keyof typeof category];
          break;
        }
      }

      if (!url) {
        console.warn(`Sound not found: ${soundName}`);
        return null;
      }

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
      
      audioBuffers.current.set(soundName, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound: ${soundName}`, error);
      return null;
    }
  };

  // Play SFX
  const playSFX = useCallback(async (soundName: string, options: AudioOptions = {}) => {
    if (!audioContext.current || !sfxGain.current) return;

    const buffer = await loadSound(soundName);
    if (!buffer) return;

    const source = audioContext.current.createBufferSource();
    source.buffer = buffer;
    
    // Apply pitch
    if (options.pitch) {
      source.playbackRate.value = options.pitch;
    }

    // Create gain node for this sound
    const gainNode = audioContext.current.createGain();
    gainNode.gain.value = options.volume ?? 1;

    // Connect
    source.connect(gainNode);
    gainNode.connect(sfxGain.current);

    // Spatial audio
    if (options.spatial && options.position) {
      const panner = audioContext.current.createPanner();
      panner.positionX.value = options.position.x;
      panner.positionY.value = options.position.y;
      panner.positionZ.value = options.position.z;
      gainNode.connect(panner);
      panner.connect(sfxGain.current);
    }

    // Play
    source.start(0);
    
    // Store reference
    activeSources.current.set(soundName, source);
    
    // Cleanup
    source.onended = () => {
      activeSources.current.delete(soundName);
    };
  }, []);

  // Play ambient sound
  const playAmbient = useCallback(async (soundName: string, options: AudioOptions = {}) => {
    if (!audioContext.current || !ambientGain.current) return;

    // Stop existing ambient
    stopAmbient();

    const buffer = await loadSound(soundName);
    if (!buffer) return;

    const source = audioContext.current.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? true;
    
    const gainNode = audioContext.current.createGain();
    gainNode.gain.value = options.volume ?? 0.5;
    
    source.connect(gainNode);
    gainNode.connect(ambientGain.current);
    
    source.start(0);
    activeSources.current.set('ambient', source);
  }, []);

  // Stop ambient
  const stopAmbient = useCallback(() => {
    const ambient = activeSources.current.get('ambient');
    if (ambient) {
      try {
        ambient.stop();
      } catch (e) {}
      activeSources.current.delete('ambient');
    }
  }, []);

  // Play music
  const playMusic = useCallback(async (soundName: string, options: AudioOptions = {}) => {
    if (!audioContext.current || !musicGain.current) return;

    // Stop existing music
    stopMusic();

    const buffer = await loadSound(soundName);
    if (!buffer) return;

    const source = audioContext.current.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? true;
    
    const gainNode = audioContext.current.createGain();
    gainNode.gain.value = options.volume ?? 0.7;
    
    source.connect(gainNode);
    gainNode.connect(musicGain.current);
    
    source.start(0);
    activeSources.current.set('music', source);
  }, []);

  // Stop music
  const stopMusic = useCallback(() => {
    const music = activeSources.current.get('music');
    if (music) {
      try {
        music.stop();
      } catch (e) {}
      activeSources.current.delete('music');
    }
  }, []);

  // Stop all sounds
  const stopAll = useCallback(() => {
    activeSources.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSources.current.clear();
  }, []);

  // Update volumes when settings change
  useEffect(() => {
    if (masterGain.current) {
      masterGain.current.gain.value = audioSettings.masterVolume;
    }
    if (ambientGain.current) {
      ambientGain.current.gain.value = audioSettings.musicVolume;
    }
    if (sfxGain.current) {
      sfxGain.current.gain.value = audioSettings.sfxVolume;
    }
    if (musicGain.current) {
      musicGain.current.gain.value = audioSettings.musicVolume;
    }
  }, [audioSettings]);

  // Resume audio context on user interaction
  useEffect(() => {
    const resumeAudio = () => {
      if (audioContext.current?.state === 'suspended') {
        audioContext.current.resume();
      }
    };

    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };
  }, []);

  return {
    initAudio,
    playSFX,
    playAmbient,
    stopAmbient,
    playMusic,
    stopMusic,
    stopAll,
    loadSound
  };
}

export default useAudioSystem;
