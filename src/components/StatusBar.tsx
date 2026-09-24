import React from 'react';
import { Lock, Bell, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const StatusBar: React.FC = () => {
  const { settings, setIEMModalOpen, setEqualizerOpen, iemSoundStage, equalizer } = usePlayer();

  // Clean native view: No fake buttons or clutter
  if (!settings.showTopStatusBar) {
    return null;
  }

  return (
    <header className="w-full z-30 flex items-center justify-between px-5 py-2 text-xs select-none bg-black/60 backdrop-blur-md border-b border-white/5 shrink-0">
      {/* Detail 1: Dedicated IEM Audiophile Stage Quick Toggle */}
      <button 
        onClick={() => setIEMModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all active:scale-95 shadow-sm ${
          iemSoundStage.enabled 
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
            : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
        }`}
        title="Open IEM Audiophile Stage (Headphone Monitor DSP)"
      >
        <Sparkles className={`w-3 h-3 ${iemSoundStage.enabled ? 'text-emerald-400' : 'text-white/50'} shrink-0`} />
        <span>{iemSoundStage.enabled ? `IEM: ${iemSoundStage.targetCurve.split('-')[0].toUpperCase()}` : 'IEM STAGE'}</span>
      </button>

      {/* Detail 2: 10-Band Studio DSP Engine */}
      <button 
        onClick={() => setEqualizerOpen(true)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-white/70 hover:text-white px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 shadow-sm"
        title="Open 10-Band Equalizer"
      >
        <span className={`w-2 h-2 rounded-full ${equalizer.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'} shrink-0`} />
        <span className="font-bold tracking-wider text-emerald-300">10-BAND DSP</span>
      </button>
    </header>
  );
};

