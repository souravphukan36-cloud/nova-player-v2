import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, Moon, Bell, Lock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const StatusBar: React.FC = () => {
  const { 
    setLockScreenOpen, 
    setNotificationShadeOpen, 
    equalizer, 
    sleepTimer, 
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

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-2 pb-1.5 bg-black/90 backdrop-blur-md text-xs font-medium text-white/80 select-none">
      {/* Time & Quick Toggles */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white tracking-tight">{time || '12:00'}</span>
        {equalizer.enabled && (
          <span 
            className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-black"
            style={{ backgroundColor: settings.accentColor }}
            title="NOVA Equalizer Active"
          >
            EQ
          </span>
        )}
        {sleepTimer.remainingSeconds !== null && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-mono">
            <Moon className="w-2.5 h-2.5" />
            {Math.ceil(sleepTimer.remainingSeconds / 60)}m
          </span>
        )}
      </div>

      {/* Punchhole Camera notch */}
      <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/20 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
      </div>

      {/* Right side: Simulation buttons + Network & Battery */}
      <div className="flex items-center gap-2.5">
        {/* Simulation Shortcuts for testing Lock Screen & Notification Shade */}
        <button
          id="btn-open-lockscreen"
          onClick={() => setLockScreenOpen(true)}
          title="Simulate Lock Screen Player"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white/90 transition-colors"
        >
          <Lock className="w-2.5 h-2.5" />
          <span>Lock</span>
        </button>

        <button
          id="btn-open-notifications"
          onClick={() => setNotificationShadeOpen(true)}
          title="Simulate Android Notification Player"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white/90 transition-colors"
        >
          <Bell className="w-2.5 h-2.5" />
          <span>Panel</span>
        </button>

        <div className="flex items-center gap-1.5 text-white/70">
          <span className="text-[10px] font-bold tracking-tight text-white/90">5G</span>
          <Wifi className="w-3.5 h-3.5" />
          <Volume2 className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-white/80">98%</span>
            <Battery className="w-4 h-4 text-white rotate-90" />
          </div>
        </div>
      </div>
    </header>
  );
};
