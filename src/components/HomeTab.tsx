import React from 'react';
import { 
  Play, 
  Pause, 
  Clock, 
  Flame, 
  FolderPlus, 
  Music, 
  Sparkles, 
  ChevronRight,
  Heart
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

interface HomeTabProps {
  onNavigateToLibrary: (subTab?: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigateToLibrary }) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    togglePlayPause,
    playTrack,
    setScannerOpen,
    toggleFavorite,
    setNowPlayingOpen,
    settings,
  } = usePlayer();

  // Recently played tracks (sorted by lastPlayed or dateAdded)
  const recentlyPlayed = [...tracks]
    .filter(t => t.lastPlayed || t.playCount > 0)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    .slice(0, 6);

  // Most played tracks
  const mostPlayed = [...tracks]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 6);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-28 px-5 select-none animate-in fade-in duration-200">
      {/* Featured / Resume Playback Hero Card */}
      {currentTrack && (
        <div 
          onClick={() => setNowPlayingOpen(true)}
          className="relative overflow-hidden rounded-3xl p-5 border border-white/10 shadow-2xl cursor-pointer group transition-all duration-300 hover:border-white/20"
          style={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' 
          }}
        >
          {/* Accent glow in corner */}
          <div 
            className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: settings.accentColor }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
              <div 
                className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-xl flex items-center justify-center text-white text-lg font-bold group-hover:scale-105 transition-transform"
                style={{ background: currentTrack.coverArt }}
              >
                {isPlaying ? '▶' : '♫'}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Now Playing</span>
                </span>
                <h3 className="text-base font-extrabold text-white truncate tracking-tight mt-0.5">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-white/60 truncate mt-0.5">
                  {currentTrack.artist} • {currentTrack.album}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold shadow-xl transition-transform active:scale-95 flex-shrink-0"
              style={{ backgroundColor: settings.accentColor }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Local Storage Scanner Banner */}
      <div 
        onClick={() => setScannerOpen(true)}
        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-black"
            style={{ backgroundColor: settings.accentColor }}
          >
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Scan Device Storage</h4>
            <p className="text-xs text-white/50">Import MP3, WAV, FLAC, AAC files from phone</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40" />
      </div>

      {/* Recently Played Section (Horizontal Carousel) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/70" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase">Recently Played</h3>
          </div>
          <button 
            onClick={() => onNavigateToLibrary('songs')}
            className="text-xs font-semibold hover:underline"
            style={{ color: settings.accentColor }}
          >
            See All ({tracks.length})
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {recentlyPlayed.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, recentlyPlayed)}
                className="w-36 flex-shrink-0 p-3 rounded-2xl bg-neutral-900/80 border border-white/10 hover:border-white/20 cursor-pointer transition-all hover:-translate-y-1 group"
              >
                <div 
                  className="w-full aspect-square rounded-xl mb-2.5 shadow-md relative overflow-hidden flex items-center justify-center text-white font-bold"
                  style={{ background: track.coverArt }}
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center text-black shadow-lg"
                      style={{ backgroundColor: settings.accentColor }}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                  {isCurrent && isPlaying && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-emerald-400 font-bold">
                      PLAYING
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                <p className="text-[11px] text-white/50 truncate mt-0.5">{track.artist}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Most Played Tracks Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase">Most Played</h3>
          </div>
          <button 
            onClick={() => onNavigateToLibrary('playlists')}
            className="text-xs font-semibold hover:underline"
            style={{ color: settings.accentColor }}
          >
            Playlists
          </button>
        </div>

        <div className="space-y-1.5">
          {mostPlayed.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playTrack(track, mostPlayed)}
                className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                  isCurrent ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <span className="w-4 text-center text-xs font-mono font-bold text-white/40">
                    {idx + 1}
                  </span>
                  <div 
                    className="w-11 h-11 rounded-xl flex-shrink-0 shadow-md flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: track.coverArt }}
                  >
                    {isCurrent && isPlaying ? '▶' : '♫'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 
                      className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-white/90'}`}
                      style={{ color: isCurrent ? settings.accentColor : undefined }}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-white/50 truncate">
                      {track.artist} • <span className="text-amber-400/80">{track.playCount} plays</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-white/40">{formatTime(track.duration)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    className={`p-1.5 rounded-full hover:bg-white/10 ${
                      track.isFavorite ? 'text-rose-500' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
