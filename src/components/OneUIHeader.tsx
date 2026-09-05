import React from 'react';
import { Sliders, Moon, FolderPlus, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface OneUIHeaderProps {
  title: string;
  subtitle?: string;
  showScanner?: boolean;
}

export const OneUIHeader: React.FC<OneUIHeaderProps> = ({ 
  title, 
  subtitle,
  showScanner = true 
}) => {
  const { 
    setEqualizerOpen, 
    setSleepTimerOpen, 
    setScannerOpen, 
    sleepTimer, 
    settings 
  } = usePlayer();

  return (
    <div className="px-5 pt-3 pb-4 flex flex-col gap-1 select-none">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Music className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-white/50 uppercase">NOVA Player</span>
        </div>

        <div className="flex items-center gap-1.5">
          {showScanner && (
            <button
              id="header-btn-scanner"
              onClick={() => setScannerOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-xs"
              title="Scan Device Music Storage"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}

          <button
            id="header-btn-sleep-timer"
            onClick={() => setSleepTimerOpen(true)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
              sleepTimer.remainingSeconds !== null ? 'text-amber-400' : 'text-white/80 hover:text-white'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-4 h-4" />
          </button>

          <button
            id="header-btn-equalizer"
            onClick={() => setEqualizerOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="NOVA Equalizer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent One UI Title */}
      <div className="mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && (
          <p className="text-xs text-white/50 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
