import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Volume2, 
  VolumeX, 
  Car, 
  X,
  Volume1
} from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';
import { getTrackDynamicPalette, isCoverArtImage, DEFAULT_FALLBACK_ART } from '../utils/dynamicColor';

export const CarModeModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleFavorite,
    carModeOpen,
    setCarModeOpen,
    settings
  } = usePlayer();
  const currentTime = usePlaybackTime();

  if (!carModeOpen || !currentTrack) return null;

  const palette = getTrackDynamicPalette(currentTrack);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none p-4 sm:p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header: Car Mode Indicator & Big Exit Button */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg"
            style={{ backgroundColor: palette.primary || settings.accentColor }}
          >
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-white">Car Driving Mode</h2>
            <p className="text-xs text-white/50">Large safe controls for your journey</p>
          </div>
        </div>

        <button
          id="btn-exit-car-mode"
          onClick={() => setCarModeOpen(false)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white transition-all border border-white/10"
        >
          <X className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>

      {/* Main Driving Stage: Huge Artwork & Extra Bold Typography */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 max-w-lg mx-auto w-full text-center">
        {/* Big Album Art with Adaptive Glow */}
        <div 
          className="w-44 h-44 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/15 flex items-center justify-center mb-6 relative"
          style={{ 
            background: currentTrack.coverArt,
            boxShadow: `0 0 50px ${palette.glow}` 
          }}
        >
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
          ) : null}
        </div>

        {/* Huge Song Title & Artist for zero squinting */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight line-clamp-1 w-full px-2">
          {currentTrack.title}
        </h1>
        <p className="text-lg sm:text-xl font-bold text-white/70 mt-1 line-clamp-1 w-full px-2"
          style={{ color: palette.primary || settings.accentColor }}
        >
          {currentTrack.artist}
        </p>

        {/* High Visibility Progress Bar */}
        <div className="w-full mt-6 px-4">
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                backgroundColor: palette.primary || settings.accentColor 
              }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-mono font-bold text-white/50 mt-1.5 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Massive Primary Controls */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mt-6 w-full">
          {/* Previous Track */}
          <button
            onClick={prevTrack}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 active:bg-white/20 flex items-center justify-center text-white transition-transform active:scale-90 border border-white/10 shadow-lg"
            title="Previous Track"
          >
            <SkipBack className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
          </button>

          {/* Huge Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-black font-extrabold shadow-2xl transition-transform active:scale-95"
            style={{ 
              backgroundColor: palette.primary || settings.accentColor,
              boxShadow: `0 0 40px ${palette.glow}` 
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 sm:w-14 sm:h-14 fill-current" />
            ) : (
              <Play className="w-12 h-12 sm:w-14 sm:h-14 fill-current ml-2" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 active:bg-white/20 flex items-center justify-center text-white transition-transform active:scale-90 border border-white/10 shadow-lg"
            title="Next Track"
          >
            <SkipForward className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Large Volume & Favorite */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-neutral-900/90 border border-white/10 max-w-lg mx-auto w-full">
        {/* Quick Favorite */}
        <button
          onClick={() => toggleFavorite(currentTrack.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
            currentTrack.isFavorite 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
              : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <Heart className={`w-6 h-6 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
          <span className="text-xs font-bold">{currentTrack.isFavorite ? 'Favorited' : 'Favorite'}</span>
        </button>

        {/* Volume Steppers for driving safety */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setVolume(Math.max(0, volume - 0.15))}
            className="p-2.5 rounded-2xl bg-white/10 active:bg-white/20 font-bold text-xs"
            title="Volume Down"
          >
            <Volume1 className="w-5 h-5" />
          </button>

          <span className="text-xs font-mono font-bold text-white/80 w-10 text-center">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>

          <button
            onClick={() => setVolume(Math.min(1, volume + 0.15))}
            className="p-2.5 rounded-2xl bg-white/10 active:bg-white/20 font-bold text-xs"
            title="Volume Up"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
