import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Lock, 
  ChevronUp, 
  Battery, 
  Wifi, 
  Bell 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const LockScreenModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    toggleFavorite,
    lockScreenOpen,
    setLockScreenOpen,
    settings,
  } = usePlayer();

  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!lockScreenOpen) return null;

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* Top Status Bar on Lock Screen */}
      <div className="flex items-center justify-between text-xs text-white/70">
        <span className="flex items-center gap-1 font-medium">
          <Lock className="w-3 h-3" />
          <span>NOVA Lock Screen</span>
        </span>
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">100%</span>
          <Battery className="w-4 h-4 rotate-90 text-white" />
        </div>
      </div>

      {/* Samsung Galaxy Signature Lock Screen Clock */}
      <div className="flex flex-col items-center justify-center my-auto text-center">
        <h1 className="text-7xl font-extralight tracking-tighter text-white font-sans">
          {time || '10:18'}
        </h1>
        <p className="text-sm font-medium text-white/70 mt-1 tracking-wide">
          {dateStr || 'Saturday, September 5'}
        </p>

        {/* Lock Screen Notification Badges */}
        <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/80 font-medium">NOVA Player Active</span>
          <Bell className="w-3 h-3 text-white/60 ml-1" />
        </div>

        {/* Samsung Music One UI Lock Screen Widget Card */}
        {currentTrack && (
          <div className="w-full max-w-sm mt-8 p-4 rounded-3xl bg-neutral-900/85 backdrop-blur-2xl border border-white/15 shadow-2xl text-left">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-2xl flex-shrink-0 shadow-lg flex items-center justify-center text-xs font-bold"
                style={{ background: currentTrack.coverArt }}
              >
                {isPlaying ? '▶' : '■'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: settings.accentColor }}>
                    NOVA Player
                  </span>
                  <button
                    onClick={() => toggleFavorite(currentTrack.id)}
                    className="text-white/60 hover:text-rose-500"
                  >
                    <Heart className={`w-3.5 h-3.5 ${currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white truncate">{currentTrack.title}</h3>
                <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Lock Screen Seek Slider */}
            <div className="mt-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg cursor-pointer accent-white"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mt-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Lock Screen Playback Controls */}
            <div className="flex items-center justify-center gap-6 mt-1">
              <button
                onClick={prevTrack}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 active:scale-90 transition-transform"
                title="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: settings.accentColor }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 active:scale-90 transition-transform"
                title="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Up or Tap to Unlock */}
      <div className="flex flex-col items-center justify-center pb-2">
        <button
          id="lockscreen-btn-unlock"
          onClick={() => setLockScreenOpen(false)}
          className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors group cursor-pointer"
        >
          <ChevronUp className="w-6 h-6 animate-bounce" />
          <span className="text-xs font-medium tracking-wide">Swipe up or tap to unlock</span>
        </button>
      </div>
    </div>
  );
};
