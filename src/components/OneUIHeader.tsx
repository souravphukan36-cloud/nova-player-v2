import React from 'react';
import { Sliders, Moon, FolderPlus } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { NatureMusicLogo } from './NatureMusicLogo';

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
          <NatureMusicLogo size={28} showText={false} />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold tracking-wider text-white uppercase">NOVA</span>
            <span className="text-[9px] font-semibold text-emerald-400 tracking-wider uppercase">Nature Audio</span>
          </div>
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
      {title ? (
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && (
            <p className="text-xs text-white/50 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      ) : null}
    </div>
  );
};
