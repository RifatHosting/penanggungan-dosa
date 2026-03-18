import { useEffect, useState } from 'react';
import useGameStore from '../../../store/gameStore';
import { Heart, Brain, Battery, MapPin } from 'lucide-react';

// Health Bar Component
function HealthBar() {
  const health = useGameStore((state) => state.player.health);
  
  const getColor = () => {
    if (health > 60) return 'from-green-500 to-green-400';
    if (health > 30) return 'from-yellow-500 to-yellow-400';
    return 'from-red-600 to-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <Heart className="w-5 h-5 text-red-500" />
      <div className="w-32 h-4 bg-black/60 rounded overflow-hidden border border-red-900/50">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-300`}
          style={{ width: `${health}%` }}
        />
      </div>
      <span className="text-xs font-mono text-red-400">{Math.round(health)}%</span>
    </div>
  );
}

// Sanity Bar Component
function SanityBar() {
  const sanity = useGameStore((state) => state.player.sanity);
  
  const getColor = () => {
    if (sanity > 60) return 'from-purple-500 to-purple-400';
    if (sanity > 30) return 'from-orange-500 to-orange-400';
    return 'from-red-700 to-red-600';
  };

  return (
    <div className="flex items-center gap-2">
      <Brain className="w-5 h-5 text-purple-500" />
      <div className="w-32 h-4 bg-black/60 rounded overflow-hidden border border-purple-900/50">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-300`}
          style={{ width: `${sanity}%` }}
        />
      </div>
      <span className="text-xs font-mono text-purple-400">{Math.round(sanity)}%</span>
    </div>
  );
}

// Flashlight Battery Component
function FlashlightBattery() {
  const battery = useGameStore((state) => state.equipment.flashlight.battery);
  const isEnabled = useGameStore((state) => state.equipment.flashlight.enabled);
  
  const getColor = () => {
    if (battery > 60) return 'from-yellow-400 to-yellow-300';
    if (battery > 30) return 'from-orange-400 to-orange-300';
    return 'from-red-500 to-red-400';
  };

  return (
    <div className="flex items-center gap-2">
      <Battery 
        className={`w-5 h-5 ${isEnabled ? 'text-yellow-400' : 'text-gray-600'}`}
      />
      <div className="w-24 h-4 bg-black/60 rounded overflow-hidden border border-yellow-900/50">
        <div 
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-300`}
          style={{ width: `${battery}%` }}
        />
      </div>
      <span className="text-xs font-mono text-yellow-400">{Math.round(battery)}%</span>
    </div>
  );
}

// Stamina Bar Component
function StaminaBar() {
  const stamina = useGameStore((state) => state.player.stamina);
  const isSprinting = useGameStore((state) => state.player.isSprinting);
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded-full ${isSprinting ? 'bg-green-500 animate-pulse' : 'bg-green-700'}`} />
      <div className="w-24 h-2 bg-black/60 rounded overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100"
          style={{ width: `${stamina}%` }}
        />
      </div>
    </div>
  );
}

// Objective Display Component
function ObjectiveDisplay() {
  const objective = useGameStore((state) => state.gameState.objective);
  const storyProgress = useGameStore((state) => state.gameState.storyProgress);
  
  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border-l-4 border-amber-600">
      <div className="text-xs text-amber-500 uppercase tracking-wider mb-1">Objective</div>
      <div className="text-sm text-amber-100 font-medium">{objective}</div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 bg-black/60 rounded overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${storyProgress}%` }}
          />
        </div>
        <span className="text-xs text-amber-400">{Math.round(storyProgress)}%</span>
      </div>
    </div>
  );
}

// Inventory Quick Slot Component
function QuickSlots() {
  const inventory = useGameStore((state) => state.inventory);
  const equipment = useGameStore((state) => state.equipment);
  
  const quickItems = inventory.slice(0, 4);
  
  return (
    <div className="flex gap-2">
      {/* Flashlight Slot */}
      <div className={`w-12 h-12 border-2 rounded flex items-center justify-center ${
        equipment.flashlight.enabled 
          ? 'border-yellow-500 bg-yellow-500/20' 
          : 'border-gray-600 bg-black/50'
      }`}>
        <span className="text-xl">🔦</span>
      </div>
      
      {/* Item Slots */}
      {quickItems.map((item, index) => (
        <div 
          key={item.id}
          className="w-12 h-12 border-2 border-gray-600 bg-black/50 rounded flex items-center justify-center relative"
        >
          <span className="text-xl">{item.icon || '📦'}</span>
          {item.quantity > 1 && (
            <span className="absolute -bottom-1 -right-1 bg-gray-800 text-xs px-1 rounded">
              {item.quantity}
            </span>
          )}
          <span className="absolute -top-2 -left-1 text-xs text-gray-400">{index + 2}</span>
        </div>
      ))}
      
      {/* Empty Slots */}
      {Array.from({ length: Math.max(0, 3 - quickItems.length) }, (_, i) => (
        <div 
          key={`empty-${i}`}
          className="w-12 h-12 border-2 border-gray-700 bg-black/30 rounded"
        />
      ))}
    </div>
  );
}

// Notification Toast Component
function NotificationToast() {
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'info' | 'warning' | 'danger';
  }>>([]);
  
  useEffect(() => {
    // Listen for notifications
    const handleNotification = (e: CustomEvent) => {
      const newNotification = {
        id: Date.now(),
        message: e.detail.message,
        type: e.detail.type || 'info'
      };
      
      setNotifications(prev => [...prev, newNotification]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 4000);
    };
    
    window.addEventListener('game-notification' as any, handleNotification);
    return () => window.removeEventListener('game-notification' as any, handleNotification);
  }, []);

  return (
    <div className="absolute right-4 top-20 flex flex-col gap-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`px-4 py-2 rounded-lg shadow-lg animate-slide-in-right ${
            notification.type === 'danger' 
              ? 'bg-red-900/90 border-l-4 border-red-500' 
              : notification.type === 'warning'
              ? 'bg-yellow-900/90 border-l-4 border-yellow-500'
              : 'bg-blue-900/90 border-l-4 border-blue-500'
          }`}
        >
          <span className="text-sm text-white">{notification.message}</span>
        </div>
      ))}
    </div>
  );
}

// Crosshair Component
function Crosshair() {
  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);
  
  if (!isGameActive || isPaused) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="w-4 h-4 rounded-full border-2 border-white/60 bg-white/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/80 rounded-full" />
    </div>
  );
}

// Interaction Prompt Component
function InteractionPrompt() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);
  
  useEffect(() => {
    const handlePrompt = (e: CustomEvent) => {
      setPrompt(e.detail.prompt);
    };
    
    window.addEventListener('interaction-prompt' as any, handlePrompt);
    return () => window.removeEventListener('interaction-prompt' as any, handlePrompt);
  }, []);

  if (!isGameActive || isPaused || !prompt) return null;

  return (
    <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
      <div className="flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg">
        <span className="px-2 py-1 bg-white/20 rounded text-xs font-bold text-white">E</span>
        <span className="text-sm text-white">{prompt}</span>
      </div>
    </div>
  );
}

// Main HUD Component
export default function HUD() {
  const isGameActive = useGameStore((state) => state.isGameActive);
  const isPaused = useGameStore((state) => state.isPaused);
  const currentLevel = useGameStore((state) => state.gameState.currentLevel);
  
  if (!isGameActive) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${isPaused ? 'opacity-50' : ''}`}>
      {/* Top Left - Stats */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <HealthBar />
        <SanityBar />
        <FlashlightBattery />
        <StaminaBar />
      </div>
      
      {/* Top Right - Objective */}
      <div className="absolute top-4 right-4 w-64">
        <ObjectiveDisplay />
      </div>
      
      {/* Bottom Left - Location */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-gray-400">
        <MapPin className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider">{currentLevel.replace('_', ' ')}</span>
      </div>
      
      {/* Bottom Center - Quick Slots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <QuickSlots />
      </div>
      
      {/* Center - Crosshair */}
      <Crosshair />
      
      {/* Interaction Prompt */}
      <InteractionPrompt />
      
      {/* Notifications */}
      <NotificationToast />
      
      {/* Vignette Effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%)'
        }}
      />
    </div>
  );
}
