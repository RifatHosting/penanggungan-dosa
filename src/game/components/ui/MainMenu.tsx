import { useState, useEffect } from 'react';
import useGameStore from '../../../store/gameStore';
import { Play, Settings, Trophy, Users, BookOpen } from 'lucide-react';

interface MenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onShowLeaderboard: () => void;
  onShowSettings: () => void;
}

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(50,20,5,0.3) 0%, rgba(0,0,0,1) 70%)'
        }}
      />
      
      {/* Animated Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)'
        }}
      />
    </div>
  );
}

// Game Logo Component
function GameLogo() {
  return (
    <div className="text-center mb-12">
      <h1 
        className="text-6xl md:text-8xl font-bold tracking-wider"
        style={{
          fontFamily: "'Cinzel Decorative', serif",
          color: '#dfccb8',
          textShadow: '0 0 30px rgba(200,50,0,0.5), 0 0 60px rgba(0,0,0,1)',
          animation: 'logoFade 3s ease-out'
        }}
      >
        PENANGGUNGAN
        <br />
        DOSA
      </h1>
      <p 
        className="mt-4 text-lg tracking-[0.3em] text-amber-600/80 italic"
        style={{ fontFamily: "'IM Fell English', serif" }}
      >
        — APOCALYPSE EDITION —
      </p>
    </div>
  );
}

// Menu Button Component
function MenuButton({ 
  children, 
  onClick, 
  icon: Icon,
  variant = 'primary'
}: { 
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variants = {
    primary: 'border-amber-700/50 hover:border-amber-500 hover:bg-amber-900/20 text-amber-200',
    secondary: 'border-gray-700/50 hover:border-gray-500 hover:bg-gray-900/20 text-gray-300',
    danger: 'border-red-900/50 hover:border-red-500 hover:bg-red-900/20 text-red-300'
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative group w-72 py-4 px-6
        border-2 rounded-lg
        transition-all duration-300
        flex items-center justify-center gap-3
        ${variants[variant]}
      `}
    >
      {Icon ? <Icon className="w-5 h-5" /> : null}
      <span className="text-sm tracking-[0.2em] uppercase font-medium">{children}</span>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
      </div>
    </button>
  );
}

// Save Slot Component
function SaveSlot({ 
  slot, 
  data, 
  onLoad 
}: { 
  slot: number;
  data: any;
  onLoad: () => void;
}) {
  return (
    <div 
      onClick={onLoad}
      className="p-4 border border-amber-800/50 rounded-lg bg-black/50 hover:bg-amber-900/20 cursor-pointer transition-all"
    >
      <div className="flex justify-between items-center">
        <span className="text-amber-500 font-medium">Slot {slot}</span>
        {data && <span className="text-xs text-gray-400">{data.saveDate}</span>}
      </div>
      {data ? (
        <div className="mt-2 text-sm text-gray-300">
          <p>Level: {data.gameState?.currentLevel}</p>
          <p>Progress: {data.gameState?.storyProgress}%</p>
          <p>Play Time: {Math.floor(data.playTime / 60)}m</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500 italic">Empty Slot</p>
      )}
    </div>
  );
}

// Main Menu Component
export default function MainMenu({ 
  onStartGame, 
  onLoadGame, 
  onShowLeaderboard, 
  onShowSettings 
}: MenuProps) {
  const [saves, setSaves] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'load' | 'multiplayer'>('main');
  
  const isLoading = useGameStore((state) => state.isLoading);

  useEffect(() => {
    // Load saves from backend
    const loadSaves = async () => {
      try {
        const response = await fetch('/api/game/saves', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSaves(data);
        }
      } catch (error) {
        console.error('Failed to load saves:', error);
      }
    };
    
    loadSaves();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">✝</div>
          <div className="w-64 h-1 bg-gray-800 rounded overflow-hidden">
            <div className="h-full bg-amber-600 animate-loading-bar" />
          </div>
          <p className="mt-4 text-amber-600 text-sm tracking-wider">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <AnimatedBackground />
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        {activeTab === 'main' && (
          <>
            <GameLogo />
            
            <div className="flex flex-col gap-4">
              <MenuButton onClick={onStartGame} icon={Play}>
                New Game
              </MenuButton>
              
              <MenuButton 
                onClick={() => setActiveTab('load')} 
                icon={BookOpen}
                variant="secondary"
              >
                Load Game
              </MenuButton>
              
              <MenuButton 
                onClick={() => setActiveTab('multiplayer')} 
                icon={Users}
                variant="secondary"
              >
                Multiplayer
              </MenuButton>
              
              <MenuButton 
                onClick={onShowLeaderboard} 
                icon={Trophy}
                variant="secondary"
              >
                Leaderboard
              </MenuButton>
              
              <MenuButton 
                onClick={onShowSettings} 
                icon={Settings}
                variant="secondary"
              >
                Settings
              </MenuButton>
            </div>
            
            {/* Version Info */}
            <div className="absolute bottom-4 text-center">
              <p className="text-xs text-gray-600">Version 1.0.0 - Triple A Edition</p>
              <p className="text-xs text-gray-700 mt-1">Built with React + Three.js</p>
            </div>
          </>
        )}
        
        {activeTab === 'load' && (
          <div className="w-full max-w-2xl px-8">
            <h2 className="text-3xl text-amber-500 text-center mb-8 tracking-wider">LOAD GAME</h2>
            
            <div className="grid gap-4">
              {Array.from({ length: 5 }, (_, i) => (
                <SaveSlot
                  key={i}
                  slot={i + 1}
                  data={saves[i]}
                  onLoad={() => {
                    if (saves[i]) {
                      onLoadGame();
                    }
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={() => setActiveTab('main')}
              className="mt-8 w-full py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              BACK
            </button>
          </div>
        )}
        
        {activeTab === 'multiplayer' && (
          <div className="w-full max-w-md px-8">
            <h2 className="text-3xl text-amber-500 text-center mb-8 tracking-wider">MULTIPLAYER</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-amber-800/50 rounded-lg bg-black/50">
                <h3 className="text-amber-400 mb-2">Create Room</h3>
                <input
                  type="text"
                  placeholder="Room Name"
                  className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-white mb-2"
                />
                <button className="w-full py-2 bg-amber-900/50 border border-amber-700 text-amber-200 rounded hover:bg-amber-800/50 transition-colors">
                  CREATE ROOM
                </button>
              </div>
              
              <div className="p-4 border border-gray-800/50 rounded-lg bg-black/50">
                <h3 className="text-gray-400 mb-2">Join Room</h3>
                <input
                  type="text"
                  placeholder="Room Code"
                  className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-white mb-2"
                />
                <button className="w-full py-2 bg-gray-900/50 border border-gray-700 text-gray-300 rounded hover:bg-gray-800/50 transition-colors">
                  JOIN ROOM
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setActiveTab('main')}
              className="mt-8 w-full py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              BACK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
