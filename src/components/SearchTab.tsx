import React, { useState } from 'react';
import { Search as SearchIcon, X, Music, Heart, Play, Download, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { isCoverArtImage, DEFAULT_FALLBACK_ART, getResolvedCoverArt } from '../utils/dynamicColor';

export const SearchTab: React.FC = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    toggleFavorite,
    settings,
    downloadedTrackIds,
    downloadTrack,
    deleteDownloadedTrack,
    isDownloading,
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [offlineOnlyFilter, setOfflineOnlyFilter] = useState(false);

  const quickChips = [
    'Offline Ready',
    'Favourites',
    'Synthwave',
    'Sourav Phukan',
    'Lossless FLAC',
    'Cyber Bass',
    'Lo-Fi Chill',
  ];

  const filteredTracks = tracks.filter((track) => {
    const isOffline = downloadedTrackIds.has(track.id) || track.isDownloaded;
    if (offlineOnlyFilter && !isOffline) return false;

    if (!query.trim()) {
      return offlineOnlyFilter ? isOffline : false;
    }

    const q = query.toLowerCase().trim();
    if (q === 'offline ready' || q === 'offline' || q === 'downloaded') {
      return isOffline;
    }
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

  const topMatch = filteredTracks.length > 0 ? filteredTracks[0] : null;

  return (
    <div className="space-y-4 pb-36 px-5 select-none animate-in fade-in duration-200">
      {/* Search Input Bar (Samsung One UI Search Bar) */}
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-4 w-4 h-4 text-white/40" />
        <input
          id="search-input"
          type="text"
          maxLength={120}
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 120))}
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
            <div className="space-y-3">
              {/* Top Match Highlight Card */}
              {topMatch && (
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 relative overflow-hidden group shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Top Match
                    </span>
                    {(downloadedTrackIds.has(topMatch.id) || topMatch.isDownloaded) && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Offline Ready
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-14 h-14 rounded-xl flex-shrink-0 shadow-md overflow-hidden relative flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: topMatch.coverArt }}
                    >
                      {isCoverArtImage(topMatch.coverArt) ? (
                        <img 
                          src={getResolvedCoverArt(topMatch.coverArt)} 
                          alt={topMatch.title} 
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
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">{topMatch.title}</h3>
                      <p className="text-xs text-white/60 truncate mt-0.5">{topMatch.artist}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 uppercase font-mono">{topMatch.format} • {formatTime(topMatch.duration)}</p>
                    </div>
                    <button
                      onClick={() => playTrack(topMatch, filteredTracks)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-black font-extrabold shadow-md transition-transform active:scale-95 flex-shrink-0"
                      style={{ backgroundColor: settings.accentColor }}
                      title="Play"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {filteredTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isOffline = downloadedTrackIds.has(track.id) || track.isDownloaded;
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
                          {isCoverArtImage(track.coverArt) ? (
                            <img 
                              src={getResolvedCoverArt(track.coverArt)} 
                              alt={track.title} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.onerror = null;
                                img.src = DEFAULT_FALLBACK_ART;
                              }}
                            />
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
                          <p className="text-[11px] text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                            <span>{track.artist}</span>
                            <span>•</span>
                            <span className="uppercase text-[9px] px-1 rounded bg-white/10 text-white/70">{track.format}</span>
                            {isOffline && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Offline</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-white/40">{formatTime(track.duration)}</span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOffline) {
                              deleteDownloadedTrack(track.id);
                            } else {
                              downloadTrack(track);
                            }
                          }}
                          disabled={isDownloading === track.id}
                          className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                            isOffline ? 'text-emerald-400' : 'text-white/40 hover:text-white'
                          }`}
                          title={isOffline ? 'Offline Ready (Stored Locally)' : 'Download Offline'}
                        >
                          {isDownloading === track.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          ) : isOffline ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

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
          )}
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Square Row: Never Heard Before / Discover Unheard Tracks */}
          {settings.searchShowUnheardShelf !== false && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Never Heard Before</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                      New Discoveries
                    </span>
                  </h3>
                  <p className="text-xs text-white/40">Gems waiting in your library that you haven't played yet</p>
                </div>
              </div>

              {/* Square Box Row */}
              <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-5 px-5">
                {[...tracks]
                  .sort((a, b) => (a.playCount || 0) - (b.playCount || 0))
                  .slice(0, 10)
                  .map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, tracks)}
                        className="group flex-shrink-0 w-32 cursor-pointer select-none"
                      >
                        {/* Square Album Cover Box */}
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 relative shadow-lg group-hover:border-white/30 transition-all">
                          {track.coverArt ? (
                            <img
                              src={track.coverArt}
                              alt={track.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-3 text-center">
                              <Music className="w-8 h-8 opacity-40 mb-1" />
                              <span className="text-[10px] font-bold text-white/80 line-clamp-2">{track.title}</span>
                            </div>
                          )}

                          {/* Unheard Badge */}
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-semibold text-amber-300 border border-amber-400/20">
                            Unheard
                          </div>

                          {/* Quick Play Circle Button */}
                          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-110 transition-all">
                            {isCurrent && isPlaying ? (
                              <div className="w-2.5 h-2.5 rounded-sm bg-black" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Song Name & Artist Info below square */}
                        <div className="mt-2">
                          <h4 
                            className={`text-xs font-bold truncate ${isCurrent ? 'text-emerald-400' : 'text-white'}`}
                            title={track.title}
                          >
                            {track.title}
                          </h4>
                          <p className="text-[10px] text-white/50 truncate" title={track.artist}>
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Quick Browse Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Explore By Vibe</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { title: 'Lossless Audio', query: 'flac', desc: 'Studio quality FLAC & WAV', color: 'from-blue-900/60 to-cyan-950/80' },
                { title: 'High Bass Tracks', query: 'cyber bass', desc: 'Punchy 8D club sound', color: 'from-purple-900/60 to-pink-950/80' },
                { title: 'Lo-Fi Melodies', query: 'lo-fi', desc: 'Cozy study & relaxation', color: 'from-amber-900/60 to-red-950/80' },
                { title: 'Top Favourites', query: 'favourites', desc: 'Your loved tracks', color: 'from-rose-900/60 to-orange-950/80' },
              ].map((cat) => (
                <button
                  key={cat.title}
                  onClick={() => setQuery(cat.query)}
                  className={`p-3.5 rounded-2xl bg-gradient-to-br ${cat.color} border border-white/10 text-left hover:border-white/20 active:scale-98 transition-all`}
                >
                  <h5 className="text-xs font-bold text-white">{cat.title}</h5>
                  <p className="text-[10px] text-white/50 mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for miniplayer and bottom navigation */}
      <div className="h-28 w-full" aria-hidden="true" />
    </div>
  );
};
