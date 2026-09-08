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
    <header className="w-full z-30 flex items-center justify-between px-5 py-2 text-xs select-none bg-black/60 backdrop-blur-md border-b border-white/5 shrink-0">
      {/* Detail 1: Studio Hi-Res Audio Indicator */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400 font-bold tracking-wider shadow-sm">
          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>HI-RES 96kHz / 24-BIT</span>
        </span>
      </div>

      {/* Detail 2: 10-Band Studio DSP Engine */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-white/70 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-bold tracking-wider text-emerald-300">10-BAND STUDIO DSP</span>
      </div>
    </header>
  );
};

