import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Lock, 
  Unlock,
  ChevronUp, 
  Battery, 
  Wifi, 
  Bell,
  Disc3,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Sparkles,
  Music
} from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';
import { isCoverArtImage, DEFAULT_FALLBACK_ART } from '../utils/dynamicColor';

export const LockScreenModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    toggleFavorite,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    lockScreenOpen,
    setLockScreenOpen,
    settings,
  } = usePlayer();
  const currentTime = usePlaybackTime();

  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [unlocking, setUnlocking] = useState(false);

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

  const handleUnlock = () => {
    setUnlocking(true);
    setTimeout(() => {
      setLockScreenOpen(false);
      setUnlocking(false);
    }, 280);
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-between p-5 sm:p-7 select-none overflow-hidden transition-all duration-300 ${
        unlocking ? 'opacity-0 -translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
      style={{ backgroundColor: '#09090b' }}
    >
      {/* 1. Dynamic Animated Blurred Album Cover Backdrop */}
      {currentTrack?.coverArt && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img 
            src={currentTrack.coverArt} 
            alt="Backdrop" 
            className={`w-full h-full object-cover blur-[90px] opacity-25 scale-125 transition-transform duration-1000 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/95" />
        </div>
      )}

      {/* 2. Top Lock Status Bar */}
      <div className="relative z-10 flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span className="text-[11px] font-sans">NOVA One UI Lock</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Wifi className="w-3.5 h-3.5 text-white/80" />
          <span className="text-[11px] font-mono">5G</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-white/80">98%</span>
            <Battery className="w-4 h-4 rotate-90 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* 3. Center Interactive Section: Galaxy Clock + Animated Artwork + Song Details */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center w-full max-w-md mx-auto">
        {/* Signature Clock */}
        <h1 className="text-6xl sm:text-7xl font-light tracking-tighter text-white font-sans drop-shadow-lg">
          {time || '10:18'}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-emerald-400/90 mt-1 tracking-wide uppercase">
          {dateStr || 'Sunday, September 6'}
        </p>

        {/* Music Player Interactive Card with Animated Spinning Vinyl Disc */}
        {currentTrack ? (
          <div className="w-full mt-6 p-4 sm:p-5 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl text-left relative overflow-hidden group">
            {/* Animated Ambient Glow */}
            <div 
              className="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: settings.accentColor }}
            />

            {/* Top Song Row: Animated Album Disc + Song Details */}
            <div className="flex items-center gap-4 relative z-10">
              {/* Rotating Vinyl Cover Art Disc */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex-shrink-0">
                {/* Vinyl Grooves Background */}
                <div 
                  className={`w-full h-full rounded-full p-1 bg-neutral-950 shadow-2xl border border-white/20 flex items-center justify-center relative overflow-hidden ${
                    isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
                  }`}
                >
                  {/* Outer Vinyl Lines */}
                  <div className="absolute inset-1 rounded-full border border-neutral-700/50 pointer-events-none" />
                  <div className="absolute inset-2.5 rounded-full border border-neutral-800 pointer-events-none" />

                  {/* Center Cover Art Photo */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden relative shadow-inner">
                    {isCoverArtImage(currentTrack.coverArt) ? (
                      <img 
                        src={currentTrack.coverArt} 
                        alt={currentTrack.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = DEFAULT_FALLBACK_ART;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-950 flex items-center justify-center text-emerald-400">
                        <Music className="w-5 h-5" />
                      </div>
                    )}

                    {/* Spindle hole */}
                    <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-black border-2 border-white/40 z-10" />
                  </div>
                </div>

                {/* Pulsing playing indicator ring */}
                {isPlaying && (
                  <div className="absolute -inset-1 rounded-full border border-emerald-400/40 animate-ping pointer-events-none opacity-60" />
                )}
              </div>

              {/* Song Information & Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      NOW PLAYING
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-white/10 text-white/80 border border-white/15">
                      {currentTrack.format}
                    </span>
                  </div>

                  <button
                    id="lock-btn-fav"
                    onClick={() => toggleFavorite(currentTrack.id)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-rose-500 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight mt-0.5">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-white/70 truncate mt-0.5 font-medium">
                  {currentTrack.artist}
                </p>
                <p className="text-[10px] text-white/40 truncate mt-0.5">
                  {currentTrack.album}
                </p>
              </div>
            </div>

            {/* Real-time Visualizer Waves Bar */}
            <div className="flex items-center justify-between gap-1 h-3 mt-3 px-1">
              {[40, 75, 100, 60, 85, 45, 95, 70, 50, 90, 65, 80, 55, 95, 70, 45, 85, 60, 40].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{
                    height: isPlaying ? `${Math.max(15, (height * ((i % 3) + 1)) % 100)}%` : '20%',
                    backgroundColor: isPlaying ? '#10B981' : 'rgba(255,255,255,0.2)',
                    opacity: isPlaying ? 0.85 : 0.3
                  }}
                />
              ))}
            </div>

            {/* Lock Screen Seek Slider */}
            <div className="mt-2.5">
              <input
                id="lock-seek-slider"
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-emerald-400"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Lock Screen Playback Controls */}
            <div className="flex items-center justify-between pt-1 px-1">
              {/* Shuffle toggle */}
              <button
                id="lock-btn-shuffle"
                onClick={() => setShuffle(shuffle === 'none' ? 'all' : 'none')}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                  shuffle === 'all' ? 'text-emerald-400' : 'text-white/40'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <button
                  id="lock-btn-prev"
                  onClick={prevTrack}
                  className="p-2.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-transform"
                  title="Previous Song"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  id="lock-btn-playpause"
                  onClick={togglePlayPause}
                  className="w-13 h-13 rounded-full flex items-center justify-center text-black font-extrabold shadow-2xl active:scale-95 transition-transform bg-emerald-400 hover:bg-emerald-300"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  id="lock-btn-next"
                  onClick={nextTrack}
                  className="p-2.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-transform"
                  title="Next Song"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Repeat toggle */}
              <button
                id="lock-btn-repeat"
                onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                  repeat !== 'none' ? 'text-emerald-400' : 'text-white/40'
                }`}
                title="Repeat Mode"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/10 text-white/50 text-xs">
            No track currently playing
          </div>
        )}
      </div>

      {/* 4. Bottom Swipe Up or Tap to Unlock Section */}
      <div className="relative z-10 flex flex-col items-center justify-center pb-2">
        <button
          id="lockscreen-btn-unlock"
          onClick={handleUnlock}
          className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-all duration-200 group cursor-pointer active:scale-95"
        >
          <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
            <ChevronUp className="w-5 h-5 animate-bounce text-emerald-400" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-white/80">
            Swipe up or tap to unlock
          </span>
        </button>
      </div>
    </div>
  );
};

