import React from 'react';
import { Play, Pause, SkipForward, ListMusic, Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const MiniPlayer: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    togglePlayPause, 
    nextTrack, 
    toggleFavorite,
    setNowPlayingOpen,
    setQueueOpen,
    settings 
  } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative px-3 pb-2 select-none pointer-events-none">
      <div 
        id="mini-player-bar"
        onClick={() => setNowPlayingOpen(true)}
        className="group relative flex items-center justify-between p-2 rounded-2xl bg-neutral-900/90 border border-white/10 backdrop-blur-xl shadow-2xl cursor-pointer hover:bg-neutral-800/90 transition-all overflow-hidden pointer-events-auto"
      >
        {/* Top Hairline Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
          <div 
            className="h-full transition-all duration-200"
            style={{ 
              width: `${Math.min(100, Math.max(0, progressPercent))}%`,
              backgroundColor: settings.accentColor 
            }}
          />
        </div>

        {/* Track Artwork & Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div 
            className="w-11 h-11 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden"
            style={{ background: currentTrack.coverArt }}
          >
            {currentTrack.coverArt && (currentTrack.coverArt.startsWith('http') || currentTrack.coverArt.startsWith('blob:') || currentTrack.coverArt.startsWith('data:')) ? (
              <img src={currentTrack.coverArt} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-white/70 uppercase">
                {currentTrack.format}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Controls */}
        <div 
          className="flex items-center gap-1 flex-shrink-0"
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
            style={{ backgroundColor: settings.accentColor }}
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
            title="Next Track"
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
