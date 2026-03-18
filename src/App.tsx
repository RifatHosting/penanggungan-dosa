import { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameCanvas from './game/components/GameCanvas';
import HUD from './game/components/ui/HUD';
import MainMenu from './game/components/ui/MainMenu';
import useGameStore from './store/gameStore';
import { useAudioSystem } from './game/hooks/useAudioSystem';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2
    }
  }
});

// Pause Menu Component
function PauseMenu({ onResume, onSave, onQuit }: { 
  onResume: () => void;
  onSave: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-black/90 border border-amber-800/50 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl text-amber-500 text-center mb-8 tracking-wider">PAUSED</h2>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={onResume}
            className="py-3 px-6 border-2 border-amber-700/50 text-amber-200 hover:bg-amber-900/20 hover:border-amber-500 transition-all rounded"
          >
            RESUME
          </button>
          
          <button
            onClick={onSave}
            className="py-3 px-6 border-2 border-gray-700/50 text-gray-300 hover:bg-gray-900/20 hover:border-gray-500 transition-all rounded"
          >
            SAVE GAME
          </button>
          
          <button
            onClick={onQuit}
            className="py-3 px-6 border-2 border-red-900/50 text-red-300 hover:bg-red-900/20 hover:border-red-500 transition-all rounded"
          >
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}

// Game Over Screen
function GameOverScreen({ onRestart, onMenu }: {
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        <h1 
          className="text-7xl font-bold text-red-700 mb-4"
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            textShadow: '0 0 30px rgba(150,0,0,0.8)',
            animation: 'pulse 2s infinite'
          }}
        >
          YOU DIED
        </h1>
        
        <p className="text-gray-500 mb-8 max-w-md mx-auto italic">
          Tengkorakmu akan terus menerus menjaga tempat makam sunyi nan beku 
          tersebut sepanjang epos abadi berjalan...
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="py-3 px-8 border-2 border-amber-700/50 text-amber-200 hover:bg-amber-900/20 hover:border-amber-500 transition-all rounded"
          >
            TRY AGAIN
          </button>
          
          <button
            onClick={onMenu}
            className="py-3 px-8 border-2 border-gray-700/50 text-gray-300 hover:bg-gray-900/20 hover:border-gray-500 transition-all rounded"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

// Victory Screen
function VictoryScreen({ onMenu }: { onMenu: () => void }) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        <h1 
          className="text-6xl font-bold text-amber-500 mb-4"
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            textShadow: '0 0 30px rgba(200,150,0,0.8)'
          }}
        >
          SURVIVED
        </h1>
        
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Kamu berhasil menguak rahasia Satanis Tua. Gereja tersebut terbakar 
          dan kamu memanggil Interpol dengan penanganan darurat biohazard 
          tingkat Iblis Tingkat Nasional.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onMenu}
            className="py-3 px-8 border-2 border-amber-700/50 text-amber-200 hover:bg-amber-900/20 hover:border-amber-500 transition-all rounded"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [showMenu, setShowMenu] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const { 
    isGameActive, 
    isPaused, 
    currentScene,
    player,
    setGameActive,
    setPaused,
    setCurrentScene,
    resetGame,
    getSaveData,
    loadSaveData
  } = useGameStore();
  
  const { initAudio, playMusic, stopAll } = useAudioSystem();

  // Start new game
  const handleStartGame = useCallback(() => {
    resetGame();
    setShowMenu(false);
    setGameActive(true);
    setCurrentScene('cutscene');
    initAudio();
    
    // Play intro after cutscene
    setTimeout(() => {
      setCurrentScene('game');
      playMusic('tension', { volume: 0.5 });
    }, 5000);
  }, [resetGame, setGameActive, setCurrentScene, initAudio, playMusic]);

  // Load game
  const handleLoadGame = useCallback(async (saveId: string) => {
    try {
      const response = await fetch(`/api/game/saves/${saveId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const saveData = await response.json();
        loadSaveData(saveData);
        setShowMenu(false);
        setGameActive(true);
        setCurrentScene('game');
        initAudio();
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }, [loadSaveData, setGameActive, setCurrentScene, initAudio]);

  // Save game
  const handleSaveGame = useCallback(async () => {
    try {
      const saveData = getSaveData();
      
      const response = await fetch('/api/game/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          saveName: `Save ${new Date().toLocaleString()}`,
          ...saveData
        })
      });
      
      if (response.ok) {
        // Show notification
        window.dispatchEvent(new CustomEvent('game-notification', {
          detail: { message: 'Game Saved!', type: 'info' }
        }));
      }
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, [getSaveData]);

  // Quit to menu
  const handleQuit = useCallback(() => {
    setGameActive(false);
    setPaused(false);
    setShowMenu(true);
    setCurrentScene('menu');
    stopAll();
  }, [setGameActive, setPaused, setCurrentScene, stopAll]);

  // Check for death
  useEffect(() => {
    if (player.health <= 0 && isGameActive) {
      setCurrentScene('gameover');
      playMusic('game_over', { loop: false });
    }
  }, [player.health, isGameActive, setCurrentScene, playMusic]);

  // Check for victory condition
  useEffect(() => {
    const gameState = useGameStore.getState().gameState;
    if (gameState.storyProgress >= 100 && isGameActive) {
      setCurrentScene('victory');
      playMusic('victory', { loop: false });
    }
  }, [isGameActive, setCurrentScene, playMusic]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF5') {
        e.preventDefault();
        if (isGameActive && !isPaused) {
          handleSaveGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameActive, isPaused, handleSaveGame]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Game Canvas */}
      {isGameActive && <GameCanvas />}
      
      {/* HUD */}
      <HUD />
      
      {/* Main Menu */}
      {showMenu && (
        <MainMenu
          onStartGame={handleStartGame}
          onLoadGame={() => handleLoadGame('latest')}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onShowSettings={() => setShowSettings(true)}
        />
      )}
      
      {/* Pause Menu */}
      {isPaused && isGameActive && (
        <PauseMenu
          onResume={() => {
            setPaused(false);
            document.body.requestPointerLock();
          }}
          onSave={handleSaveGame}
          onQuit={handleQuit}
        />
      )}
      
      {/* Game Over */}
      {currentScene === 'gameover' && (
        <GameOverScreen
          onRestart={handleStartGame}
          onMenu={handleQuit}
        />
      )}
      
      {/* Victory */}
      {currentScene === 'victory' && (
        <VictoryScreen onMenu={handleQuit} />
      )}
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-black border border-gray-700 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl text-amber-500 mb-6">SETTINGS</h2>
            {/* Settings content would go here */}
            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full py-2 border border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
      
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-black border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-2xl text-amber-500 mb-6">LEADERBOARD</h2>
            {/* Leaderboard content would go here */}
            <button
              onClick={() => setShowLeaderboard(false)}
              className="mt-4 w-full py-2 border border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with QueryClientProvider
function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default AppWrapper;
