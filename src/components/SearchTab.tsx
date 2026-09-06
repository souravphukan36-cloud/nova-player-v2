import React, { useState } from 'react';
import { Search as SearchIcon, X, Music, Heart, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const SearchTab: React.FC = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    toggleFavorite,
    settings,
  } = usePlayer();

  const [query, setQuery] = useState('');

  const quickChips = [
    'Favourites',
    'Synthwave',
    'Sourav Phukan',
    'Lossless FLAC',
    'Cyber Bass',
    'Lo-Fi Chill',
  ];

  const filteredTracks = tracks.filter((track) => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    if (q === 'favourites' || q === 'favorite') {
      return track.isFavorite;
    }
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.album.toLowerCase().includes(q) ||
      track.genre.toLowerCase().includes(q) ||
      track.format.toLowerCase().includes(q) ||
      track.folder.toLowerCase().includes(q)
    );
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 pb-36 px-5 select-none animate-in fade-in duration-200">
      {/* Search Input Bar (Samsung One UI Search Bar) */}
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-4 w-4 h-4 text-white/40" />
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums, genres..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/30 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 p-1 rounded-full text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search Chips */}
      <div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickChips.map((chip) => {
            const isCurrent = query.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                onClick={() => setQuery(chip)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-black font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/70 hover:text-white'
                }`}
                style={{ backgroundColor: isCurrent ? settings.accentColor : undefined }}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      {query.trim() ? (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>Results for "{query}"</span>
            <span>{filteredTracks.length} tracks found</span>
          </div>

          {filteredTracks.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No music matches found</p>
              <p className="text-xs text-white/30 mt-1">Try searching by artist, album, or file extension</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, filteredTracks)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                      isCurrent ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div 
                        className="w-11 h-11 rounded-xl flex-shrink-0 shadow-md relative overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: track.coverArt }}
                      >
                        {track.coverArt && (track.coverArt.startsWith('http') || track.coverArt.startsWith('blob:') || track.coverArt.startsWith('data:')) ? (
                          <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : null}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          {isCurrent && isPlaying ? '▶' : idx + 1}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 
                          className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-white/90'}`}
                          style={{ color: isCurrent ? settings.accentColor : undefined }}
                        >
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-white/50 truncate">
                          {track.artist} • {track.album}
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
          )}
        </div>
      ) : (
        // Empty Search Prompt
        <div className="py-12 text-center text-white/40 space-y-2">
          <SearchIcon className="w-12 h-12 mx-auto text-white/20 mb-2" />
          <h3 className="text-sm font-bold text-white/70">Search Across All Tracks</h3>
          <p className="text-xs text-white/40 max-w-xs mx-auto">
            Find local MP3, WAV, FLAC songs by title, artist, album, or folder.
          </p>
        </div>
      )}
    </div>
  );
};
