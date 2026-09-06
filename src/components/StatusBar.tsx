import React, { useState, useEffect } from 'react';
import { Lock, Bell, Sliders } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const StatusBar: React.FC = () => {
  const { 
    setLockScreenOpen, 
    setNotificationShadeOpen, 
    setEqualizerOpen,
    equalizer, 
    settings 
  } = usePlayer();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Setting to hide or show top bar
  if (!settings.showTopStatusBar) {
    return null;
  }

  const redAccentClass = settings.topBarRedAccent
    ? 'text-red-500 font-bold tracking-wider'
    : 'text-white/80 font-medium';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-black/95 border-b border-red-500/20 text-xs select-none backdrop-blur-md">
      {/* Left: TIME in Red */}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${redAccentClass} font-mono`}>
          {time || '12:00'}
        </span>
      </div>

      {/* Center: EQ Toggle Button */}
      <button
        id="btn-top-eq"
        onClick={() => setEqualizerOpen(true)}
        title="Open Equalizer"
        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all active:scale-95 ${
          settings.topBarRedAccent
            ? 'border-red-500/40 text-red-500 hover:bg-red-500/10 font-bold'
            : 'border-white/20 text-white hover:bg-white/10'
        } ${equalizer.enabled ? 'bg-red-500/20' : 'bg-transparent'}`}
      >
        <Sliders className="w-3 h-3" />
        <span className="text-[11px] font-bold tracking-wider uppercase">EQ</span>
        {equalizer.enabled && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-0.5" />
        )}
      </button>

      {/* Right: LOCK and PANEL Buttons in Red Text */}
      <div className="flex items-center gap-2">
        <button
          id="btn-open-lockscreen"
          onClick={() => setLockScreenOpen(true)}
          title="Lock Screen Player"
          className={`flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors ${redAccentClass}`}
        >
          <Lock className="w-3 h-3 text-red-500" />
          <span className="text-[11px] uppercase">LOCK</span>
        </button>

        <button
          id="btn-open-notifications"
          onClick={() => setNotificationShadeOpen(true)}
          title="Android Notification Shade"
          className={`flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors ${redAccentClass}`}
        >
          <Bell className="w-3 h-3 text-red-500" />
          <span className="text-[11px] uppercase">PANEL</span>
        </button>
      </div>
    </header>
  );
};
