import React, { useState } from 'react';
import { Moon, X, Check, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SleepTimerModal: React.FC = () => {
  const {
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
    sleepTimerOpen,
    setSleepTimerOpen,
    settings,
  } = usePlayer();

  const [customMins, setCustomMins] = useState<string>('20');
  const [endOfTrackOnly, setEndOfTrackOnly] = useState<boolean>(false);

  if (!sleepTimerOpen) return null;

  const presets = [15, 30, 45, 60, 90];

  const handleSelectMinutes = (mins: number) => {
    startSleepTimer(mins, endOfTrackOnly);
    setSleepTimerOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMins);
    if (val > 0) {
      startSleepTimer(val, endOfTrackOnly);
      setSleepTimerOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/15 p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300"
        style={{ backgroundColor: settings.theme === 'amoled' ? '#09090D' : '#121620' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-black"
              style={{ backgroundColor: settings.accentColor }}
            >
              <Moon className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sleep Timer</h3>
              <p className="text-xs text-white/50">Audio will gently stop after time expires</p>
            </div>
          </div>

          <button
            onClick={() => setSleepTimerOpen(false)}
            className="p-1 rounded-full text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer Status */}
        {sleepTimer.remainingSeconds !== null && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Clock className="w-4 h-4" />
              <span>
                Remaining: {Math.floor(sleepTimer.remainingSeconds / 60)}m {sleepTimer.remainingSeconds % 60}s
              </span>
            </div>
            <button
              onClick={cancelSleepTimer}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Presets List */}
        <div className="grid grid-cols-3 gap-2">
          {presets.map((mins) => {
            const isSelected = sleepTimer.minutes === mins;
            return (
              <button
                key={mins}
                onClick={() => handleSelectMinutes(mins)}
                className={`py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'text-black font-bold shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                style={{ backgroundColor: isSelected ? settings.accentColor : undefined }}
              >
                {mins} Minutes
              </button>
            );
          })}
        </div>

        {/* Custom Minutes Input */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="number"
            min="1"
            max="480"
            value={customMins}
            onChange={(e) => setCustomMins(e.target.value)}
            placeholder="Custom mins"
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-lg"
            style={{ backgroundColor: settings.accentColor }}
          >
            Set
          </button>
        </form>

        {/* End of Current Track Option */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <p className="text-xs font-semibold text-white">Wait for track to finish</p>
            <p className="text-[11px] text-white/40">Smooth stop at the end of track</p>
          </div>
          <button
            type="button"
            onClick={() => setEndOfTrackOnly(!endOfTrackOnly)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
              endOfTrackOnly
                ? 'border-transparent text-black'
                : 'border-white/20 text-transparent'
            }`}
            style={{ backgroundColor: endOfTrackOnly ? settings.accentColor : undefined }}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
