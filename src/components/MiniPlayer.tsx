import React, { useState, useRef } from 'react';
import { Play, Pause, SkipForward, ListMusic, Heart } from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';
import { getTrackDynamicPalette, isCoverArtImage, DEFAULT_FALLBACK_ART } from '../utils/dynamicColor';

export const MiniPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    togglePlayPause, 
    nextTrack, 
    prevTrack,
    toggleFavorite,
    setNowPlayingOpen,
    setQueueOpen,
    settings 
  } = usePlayer();
  const currentTime = usePlaybackTime();

  const [dragX, setDragX] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const palette = getTrackDynamicPalette(currentTrack);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    // If mainly horizontal drag, give tactile visual feedback
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

    // 1. Horizontal swipe: Left -> Next Track, Right -> Previous Track
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) && elapsed < 500) {
      if (diffX < 0) {
        nextTrack();
      } else {
        prevTrack();
      }
      return;
    }

    // 2. Vertical swipe up: Open Full Player
    if (diffY < -35 && Math.abs(diffY) > Math.abs(diffX)) {
      setNowPlayingOpen(true);
      return;
    }

    // 3. Quick tap: Open Full Player
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && elapsed < 300) {
      setNowPlayingOpen(true);
    }
  };

  return (
    <div className="relative px-3 pb-2 select-none pointer-events-none">
      <div 
        id="mini-player-bar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setNowPlayingOpen(true)}
        style={{
          transform: `translateX(${dragX}px)`,
          borderColor: palette.border,
          boxShadow: `0 10px 25px -5px ${palette.glow}`,
          transition: dragX === 0 ? 'transform 0.25s ease-out, box-shadow 0.4s ease' : 'none'
        }}
        className="group relative flex items-center justify-between p-2 rounded-2xl bg-neutral-900/95 border backdrop-blur-xl cursor-pointer hover:bg-neutral-850/95 transition-all overflow-hidden pointer-events-auto"
      >
        {/* Dynamic Subtle Ambient Tint */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-700"
          style={{ background: palette.gradient }}
        />

        {/* Top Hairline Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 z-10">
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
            className="w-11 h-11 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden ring-1 ring-white/10"
            style={{ background: currentTrack.coverArt }}
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
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5">
                <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate tracking-tight">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-white/60 truncate flex items-center gap-1.5">
              <span>{currentTrack.artist}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 uppercase font-mono">
                {currentTrack.format}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Controls */}
        <div 
          className="flex items-center gap-1 flex-shrink-0 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            id="mini-btn-favorite"
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
              currentTrack.isFavorite ? 'text-rose-500' : 'text-white/60 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            id="mini-btn-play-pause"
            onClick={togglePlayPause}
            className="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: palette.primary || settings.accentColor }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="mini-btn-next"
            onClick={nextTrack}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Next Track (or swipe left)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            id="mini-btn-queue"
            onClick={() => {
              setNowPlayingOpen(true);
              setQueueOpen(true);
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="View Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
