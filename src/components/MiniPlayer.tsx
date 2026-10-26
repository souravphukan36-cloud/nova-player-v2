import React, { useState, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ListMusic, 
  Heart, 
  Sliders, 
  Mic2, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Shuffle, 
  Repeat, 
  Maximize2 
} from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';
import { getTrackDynamicPalette, DEFAULT_FALLBACK_ART, getTrackCoverArt } from '../utils/dynamicColor';

export const MiniPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    togglePlayPause, 
    nextTrack, 
    prevTrack,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    toggleFavorite,
    setNowPlayingOpen,
    setEqualizerOpen,
    setLyricsOpen,
    setQueueOpen,
    equalizer,
    settings 
  } = usePlayer();
  const currentTime = usePlaybackTime();

  const [dragX, setDragX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const palette = getTrackDynamicPalette(currentTrack);
  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Seek bar click & scrub calculation
  const handleSeekFromEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetSeconds = (pos / rect.width) * duration;
    seek(targetSeconds);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverTime((pos / rect.width) * duration);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragX(Math.max(-80, Math.min(80, diffX * 0.6)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    setDragX(0);
    touchStartRef.current = null;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) && elapsed < 500) {
      if (diffX < 0) nextTrack();
      else prevTrack();
      return;
    }
    if (diffY < -35 && Math.abs(diffY) > Math.abs(diffX)) {
      setNowPlayingOpen(true);
      return;
    }
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && elapsed < 300) {
      setNowPlayingOpen(true);
    }
  };

  const toggleRepeatMode = () => {
    if (repeat === 'off') setRepeat('all');
    else if (repeat === 'all') setRepeat('one');
    else setRepeat('off');
  };

  const toggleShuffleMode = () => {
    setShuffle(shuffle === 'off' ? 'all' : 'off');
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP / TABLET: SOLID FULL-WIDTH PERSISTENT WEB PLAYER BAR */}
      {/* ============================================================== */}
      <div 
        className={`hidden md:flex items-center justify-between px-6 py-2.5 w-full select-none border-t backdrop-blur-2xl transition-colors duration-300 pointer-events-auto ${
          isLight
            ? 'bg-white/95 text-neutral-900 border-neutral-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]'
            : 'bg-[#0B0D14]/95 text-white border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Left Section: Track Info & Artwork */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[200px] max-w-[320px]">
          <div 
            onClick={() => setNowPlayingOpen(true)}
            className="w-13 h-13 rounded-xl shadow-md shrink-0 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden cursor-pointer group ring-1 ring-black/10"
          >
            <img 
              src={getTrackCoverArt(currentTrack)} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = DEFAULT_FALLBACK_ART;
              }}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <span className="w-1 h-3.5 bg-white rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-white rounded-full animate-pulse delay-75" />
                <span className="w-1 h-2.5 bg-white rounded-full animate-pulse delay-150" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4 
              onClick={() => setNowPlayingOpen(true)}
              className={`text-sm font-bold truncate tracking-tight cursor-pointer hover:underline ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h4>
            <p className={`text-xs truncate flex items-center gap-1.5 ${isLight ? 'text-neutral-500' : 'text-white/60'}`}>
              <span>{currentTrack.artist}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
                isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-white/10 text-white/70'
              }`}>
                {currentTrack.format}
              </span>
            </p>
          </div>

          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`p-2 rounded-full transition-transform active:scale-90 ${
              currentTrack.isFavorite 
                ? 'text-rose-500' 
                : isLight ? 'text-neutral-400 hover:text-neutral-800' : 'text-white/40 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Section: Playback Controls & Interactive Timeline */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-2xl px-6">
          {/* Controls Row */}
          <div className="flex items-center gap-4">
            {/* Shuffle */}
            <button
              onClick={toggleShuffleMode}
              className={`p-1.5 rounded-full transition-colors ${
                shuffle !== 'off' 
                  ? 'text-emerald-400' 
                  : isLight ? 'text-neutral-400 hover:text-neutral-800' : 'text-white/40 hover:text-white'
              }`}
              title={`Shuffle: ${shuffle}`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={prevTrack}
              className={`p-1.5 rounded-full transition-colors active:scale-95 ${
                isLight ? 'text-neutral-700 hover:text-neutral-900' : 'text-white/70 hover:text-white'
              }`}
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full flex items-center justify-center text-black font-black shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: palette.primary || settings.accentColor }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={nextTrack}
              className={`p-1.5 rounded-full transition-colors active:scale-95 ${
                isLight ? 'text-neutral-700 hover:text-neutral-900' : 'text-white/70 hover:text-white'
              }`}
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeatMode}
              className={`p-1.5 rounded-full transition-colors relative ${
                repeat !== 'off' 
                  ? 'text-emerald-400' 
                  : isLight ? 'text-neutral-400 hover:text-neutral-800' : 'text-white/40 hover:text-white'
              }`}
              title={`Repeat: ${repeat}`}
            >
              <Repeat className="w-4 h-4" />
              {repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-[8px] font-black bg-emerald-500 text-black rounded-full w-3 h-3 flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Timeline & Scrubber Bar */}
          <div className="w-full flex items-center gap-3">
            <span className={`text-[11px] font-mono font-medium min-w-[32px] text-right ${
              isLight ? 'text-neutral-500' : 'text-white/50'
            }`}>
              {formatTime(currentTime)}
            </span>

            {/* Interactive Progress Bar */}
            <div 
              ref={progressBarRef}
              onClick={handleSeekFromEvent}
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => {
                setIsHoveringProgress(false);
                setHoverTime(null);
              }}
              onMouseMove={handleProgressMouseMove}
              className="relative flex-1 h-5 flex items-center cursor-pointer group"
            >
              {/* Hover Time Tooltip */}
              {isHoveringProgress && hoverTime !== null && (
                <div 
                  className="absolute -top-7 px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-mono pointer-events-none -translate-x-1/2 shadow-lg border border-white/10"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              {/* Groove Background */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden transition-all group-hover:h-2 ${
                isLight ? 'bg-neutral-200' : 'bg-white/15'
              }`}>
                {/* Active Played Track */}
                <div 
                  className="h-full transition-all duration-150"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                    backgroundColor: palette.primary || settings.accentColor 
                  }}
                />
              </div>

              {/* Scrubber Knob (Thumb) */}
              <div 
                className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow-md -translate-x-1/2 pointer-events-none transition-transform ${
                  isHoveringProgress ? 'scale-125' : 'scale-0 group-hover:scale-100'
                }`}
                style={{ 
                  left: `${Math.min(100, Math.max(0, progressPercent))}%`,
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}
              />
            </div>

            <span className={`text-[11px] font-mono font-medium min-w-[32px] ${
              isLight ? 'text-neutral-500' : 'text-white/50'
            }`}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Section: Studio FX, Lyrics, Queue & Volume */}
        <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[200px]">
          {/* Synchronized Lyrics */}
          <button
            onClick={() => setLyricsOpen(true)}
            className={`p-2 rounded-xl transition-all ${
              isLight ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="Synchronized Lyrics"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* 10-Band EQ Button */}
          <button
            onClick={() => setEqualizerOpen(true)}
            className={`p-2 rounded-xl relative transition-all ${
              equalizer.enabled 
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                : isLight ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="10-Band Studio Equalizer"
          >
            <Sliders className="w-4 h-4" />
            {equalizer.enabled && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Queue Button */}
          <button
            onClick={() => setQueueOpen(true)}
            className={`p-2 rounded-xl transition-all ${
              isLight ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title="Playback Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 pl-2 border-l" style={{
            borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-emerald-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MOBILE: SLEEK COMPACT FLOATING BAR (FOR PHONES ONLY)        */}
      {/* ============================================================== */}
      <div className="md:hidden relative px-3 pb-1.5 select-none pointer-events-none">
        <div 
          id="mini-player-bar-mobile"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setNowPlayingOpen(true)}
          style={{
            transform: `translateX(${dragX}px)`,
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : palette.border,
            boxShadow: isLight ? '0 12px 28px -4px rgba(0,0,0,0.12)' : `0 10px 25px -5px ${palette.glow}`,
            transition: dragX === 0 ? 'transform 0.25s ease-out, box-shadow 0.4s ease' : 'none'
          }}
          className={`group relative flex items-center justify-between p-2 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all overflow-hidden pointer-events-auto ${
            isLight 
              ? 'bg-white/95 text-neutral-900 border-neutral-200/90' 
              : 'bg-[#12141C]/95 text-white border-white/10'
          }`}
        >
          {/* Top Hairline Progress Bar */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] z-10 ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
            <div 
              className="h-full transition-all duration-200"
              style={{ 
                width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                backgroundColor: palette.primary || settings.accentColor 
              }}
            />
          </div>

          {/* Track Artwork & Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2 relative z-10">
            <div 
              className="w-11 h-11 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden ring-1 ring-black/10"
            >
              <img 
                src={getTrackCoverArt(currentTrack)} 
                alt={currentTrack.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = DEFAULT_FALLBACK_ART;
                }}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className={`text-sm font-semibold truncate tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                {currentTrack.title}
              </h4>
              <p className={`text-xs truncate flex items-center gap-1.5 ${isLight ? 'text-neutral-500' : 'text-white/60'}`}>
                <span>{currentTrack.artist}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-white/10 text-white/70'}`}>
                  {currentTrack.format}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Mobile Controls */}
          <div 
            className="flex items-center gap-1 flex-shrink-0 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`p-2 rounded-full transition-colors ${
                currentTrack.isFavorite 
                  ? 'text-rose-500' 
                  : isLight ? 'text-neutral-400 hover:text-neutral-800' : 'text-white/60 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold shadow-lg transition-transform active:scale-95"
              style={{ backgroundColor: palette.primary || settings.accentColor }}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className={`p-2 rounded-full transition-colors ${
                isLight ? 'text-neutral-600 hover:text-neutral-900' : 'text-white/80 hover:text-white'
              }`}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
