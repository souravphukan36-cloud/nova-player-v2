import React from 'react';
import { Lock, Bell, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const StatusBar: React.FC = () => {
  const { settings } = usePlayer();

  // Clean native view: No fake buttons or clutter
  if (!settings.showTopStatusBar) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-1 bg-black/90 border-b border-white/5 text-xs select-none backdrop-blur-md">
      {/* Studio Hi-Res Audio Indicator */}
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
          <span>HI-RES 96kHz / 24-BIT</span>
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>STUDIO ENGINE</span>
      </div>
    </header>
  );
};

