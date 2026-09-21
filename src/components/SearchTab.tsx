import React, { useState } from 'react';
import { 
  Search as SearchIcon, 
  X, 
  Music, 
  Heart, 
  Play, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  CloudRain, 
  Sun, 
  Flame, 
  Headphones, 
  Music2, 
  Compass
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { isCoverArtImage, DEFAULT_FALLBACK_ART, getResolvedCoverArt } from '../utils/dynamicColor';

interface MoodCategory {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  gradient: string;
  accent: string;
  icon: 'heart' | 'cloud-rain' | 'sun' | 'flame' | 'headphones' | 'music2' | 'sparkles' | 'compass';
  keywords: string[];
}

const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'romantic',
    name: 'Romantic',
    subtitle: 'Heartfelt melodies & tender strings',
    badge: 'LOVE & DIL',
    gradient: 'from-pink-950/70 via-rose-900/40 to-neutral-900',
    accent: '#f43f5e',
    icon: 'heart',
    keywords: ['raabta', 'dil jhoom', 'kaise hua', 'arz kiya hai', 'jo tum mere ho', 'surili', 'romantic', 'love', 'romance']
  },
  {
    id: 'sad',
    name: 'Sad & Melancholy',
    subtitle: 'Emotional acoustic & cathartic release',
    badge: 'HEARTBREAK',
    gradient: 'from-slate-900 via-blue-950/60 to-neutral-900',
    accent: '#60a5fa',
    icon: 'cloud-rain',
    keywords: ['choo lo', 'faasle', 'the last letter', 'bairan', 'muntazir', 'sad', 'melancholy', 'pain']
  },
  {
    id: 'rainy',
    name: 'Rainy Day',
    subtitle: 'Gentle drizzle, warm tea & calm thoughts',
    badge: 'MONSOON VIBES',
    gradient: 'from-teal-950/70 via-cyan-950/50 to-neutral-900',
    accent: '#2dd4bf',
    icon: 'cloud-rain',
    keywords: ['rain', 'monsoon', 'choo lo', 'lo-fi', 'ambient', 'acoustic', 'cozy', 'tea']
  },
  {
    id: 'sunny',
    name: 'Sunny Day',
    subtitle: 'Bright golden rays & uplifting energy',
    badge: 'FEEL GOOD',
    gradient: 'from-amber-950/70 via-orange-950/40 to-neutral-900',
    accent: '#fbbf24',
    icon: 'sun',
    keywords: ['come and get your love', 'nadaan parinde', 'sun', 'happy', 'bright', 'upbeat', 'energy', 'retro']
  },
  {
    id: 'party',
    name: 'Party & Club',
    subtitle: 'Punchy 8D bass & driving weekend tempo',
    badge: 'HIGH ENERGY',
    gradient: 'from-purple-950/70 via-fuchsia-950/50 to-neutral-900',
    accent: '#d946ef',
    icon: 'flame',
    keywords: ['black star', 'cyber bass', 'party', 'rock', 'dance', 'electronic', 'club', 'bass']
  },
  {
    id: 'lofi',
    name: 'Lo-Fi & Chill',
    subtitle: 'Mellow tape warbles & late-night study',
    badge: 'COZY STUDY',
    gradient: 'from-indigo-950/70 via-violet-950/50 to-neutral-900',
    accent: '#a78bfa',
    icon: 'headphones',
    keywords: ['the last letter', 'lo-fi', 'ambient', 'chill', 'study', 'relax', 'midnight']
  },
  {
    id: 'acoustic',
    name: 'Acoustic & Soul',
    subtitle: 'Raw vocals & warm fingerpicked guitars',
    badge: 'UNPLUGGED',
    gradient: 'from-yellow-950/60 via-stone-900 to-neutral-900',
    accent: '#eab308',
    icon: 'music2',
    keywords: ['arz kiya hai', 'aaoge tum kabhi', 'somewhere only we know', 'acoustic', 'unplugged', 'guitar', 'indie']
  },
  {
    id: 'retro',
    name: 'Retro & 90s Classics',
    subtitle: 'Timeless melodies from Kishore, Rafi & 90s golden era',
    badge: 'CLASSIC NOSTALGIA',
    gradient: 'from-amber-950/80 via-yellow-950/40 to-neutral-900',
    accent: '#f59e0b',
    icon: 'compass',
    keywords: ['pal pal', 'kishore', 'rafi', 'mukesh', 'lata', 'retro', 'classic', '90s', 'golden', 'purane']
  },
  {
    id: 'sufi',
    name: 'Bhakti & Spiritual',
    subtitle: 'Soul-elevating bhajans, aarti & mystic sufi',
    badge: 'DEVOTIONAL',
    gradient: 'from-orange-950/70 via-amber-900/40 to-neutral-900',
    accent: '#fb923c',
    icon: 'sparkles',
    keywords: ['bhajan', 'aarti', 'hanuman', 'shiva', 'krishna', 'ram', 'sufi', 'spiritual', 'mystic', 'qawwali', 'devotional']
  }
];

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
  const [activeMood, setActiveMood] = useState<MoodCategory | null>(null);
  const [offlineOnlyFilter, setOfflineOnlyFilter] = useState(false);

  const quickChips = [
    'Offline Ready',
    'Favourites',
    'Indie Rock',
    'Sourav Phukan',
    'Lossless FLAC',
    'High Bass',
    'Lo-Fi Melodies',
  ];

  const handleSelectMood = (mood: MoodCategory) => {
    if (activeMood?.id === mood.id) {
      setActiveMood(null);
      setQuery('');
    } else {
      setActiveMood(mood);
      setQuery(mood.name);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveMood(null);
  };

  const filteredTracks = tracks.filter((track) => {
    const isOffline = downloadedTrackIds.has(track.id) || track.isDownloaded;
    if (offlineOnlyFilter && !isOffline) return false;

    // Mood-specific keyword filtering
    if (activeMood && (!query.trim() || query.trim() === activeMood.name)) {
      const titleLower = track.title.toLowerCase();
      const artistLower = track.artist.toLowerCase();
      const albumLower = track.album.toLowerCase();
      const genreLower = (track.genre || '').toLowerCase();
      
      const matchesMood = activeMood.keywords.some((keyword) => 
        titleLower.includes(keyword) || 
        artistLower.includes(keyword) || 
        albumLower.includes(keyword) || 
        genreLower.includes(keyword)
      );

      if (matchesMood) return true;
      // Fallback: If not enough matching, match genre
      return false;
    }

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

  const renderMoodIcon = (iconName: MoodCategory['icon'], color: string) => {
    const className = "w-5 h-5";
    switch (iconName) {
      case 'heart': return <Heart className={className} style={{ color }} />;
      case 'cloud-rain': return <CloudRain className={className} style={{ color }} />;
      case 'sun': return <Sun className={className} style={{ color }} />;
      case 'flame': return <Flame className={className} style={{ color }} />;
      case 'headphones': return <Headphones className={className} style={{ color }} />;
      case 'music2': return <Music2 className={className} style={{ color }} />;
      case 'sparkles': return <Sparkles className={className} style={{ color }} />;
      default: return <Compass className={className} style={{ color }} />;
    }
  };

  return (
    <div className="space-y-4 pb-52 px-4 sm:px-5 select-none animate-in fade-in duration-200">
      {/* Search Input Bar (Samsung One UI Search Bar) */}
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-4 w-4 h-4 text-white/40" />
        <input
          id="search-input"
          type="text"
          maxLength={120}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.slice(0, 120));
            if (activeMood && e.target.value !== activeMood.name) {
              setActiveMood(null);
            }
          }}
          placeholder="Search songs, artists, albums, moods, genres..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/30 transition-all"
        />
        {query && (
          <button
            onClick={handleClearSearch}
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
                onClick={() => {
                  setActiveMood(null);
                  setQuery(chip);
                }}
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

      {/* Active Mood Pill Banner */}
      {activeMood && (
        <div 
          className="p-3 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1"
          style={{
            backgroundColor: `${activeMood.accent}15`,
            borderColor: `${activeMood.accent}40`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-black/40">
              {renderMoodIcon(activeMood.icon, activeMood.accent)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold text-white truncate">{activeMood.name} Mood</h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 uppercase tracking-wider text-white/80">
                  {activeMood.badge}
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate">{activeMood.subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClearSearch}
            className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
            title="Clear mood filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results Header or Mood Grid */}
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
              <p className="text-xs text-white/30 mt-1">Try tapping another mood card or searching by artist name</p>
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
                      ) : (
                        <Music className="w-5 h-5 text-white/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{topMatch.title}</h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">{topMatch.artist} • {topMatch.album}</p>
                    </div>
                    <button
                      onClick={() => playTrack(topMatch, filteredTracks)}
                      className="p-3 rounded-xl bg-emerald-500 text-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      {currentTrack?.id === topMatch.id && isPlaying ? (
                        <div className="w-4 h-4 rounded-sm bg-black" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tracks List (Deduplicated: excludes topMatch if already shown above) */}
              {((topMatch ? filteredTracks.slice(1) : filteredTracks).length > 0) && (
                <div className="space-y-1.5 pt-1">
                  {topMatch && (
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-white/40 px-1">
                      More Songs ({filteredTracks.length - 1})
                    </div>
                  )}
                  {(topMatch ? filteredTracks.slice(1) : filteredTracks).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isOffline = downloadedTrackIds.has(track.id) || track.isDownloaded;

                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, filteredTracks)}
                        className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                          isCurrent
                            ? 'bg-white/15 border-white/30 shadow-md'
                            : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <div 
                            className="w-11 h-11 rounded-xl flex-shrink-0 shadow-sm overflow-hidden relative flex items-center justify-center text-[10px] font-bold text-white"
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
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: settings.accentColor }} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 
                              className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-white/90'}`}
                              style={{ color: isCurrent ? settings.accentColor : undefined }}
                            >
                              {track.title}
                            </h4>
                            <div className="text-[11px] text-white/50 flex items-center gap-1.5 mt-0.5 min-w-0">
                              <span className="truncate max-w-[150px] sm:max-w-[220px]">{track.artist}</span>
                              <span className="shrink-0">•</span>
                              <span className="shrink-0 uppercase text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-mono font-medium">{track.format}</span>
                              {isOffline && (
                                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Offline</span>
                                </span>
                              )}
                            </div>
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
                            title="Toggle Favorite"
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
          )}
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Rectangular Moods Grid (Requested: Romantic, Sad, Rainy, Sunny Day, Party, etc.) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2 font-sans">
                  <span>Browse By Mood</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono font-semibold">
                    Rectangular Mood Cards
                  </span>
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Select a vibe to immediately immerse in matching sonic tones</p>
              </div>
            </div>

            {/* Rectangular Mood Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {MOOD_CATEGORIES.map((mood) => {
                const isSelected = activeMood?.id === mood.id;
                return (
                  <button
                    key={mood.id}
                    id={`mood-card-${mood.id}`}
                    onClick={() => handleSelectMood(mood)}
                    className={`relative w-full h-20 sm:h-24 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r ${mood.gradient} border text-left transition-all duration-300 overflow-hidden flex items-center justify-between group active:scale-[0.98] shadow-lg ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30 scale-[1.01]'
                        : 'border-white/10 hover:border-white/25 hover:shadow-xl'
                    }`}
                  >
                    {/* Background Subtle Ambient Glow */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-32 opacity-20 group-hover:opacity-35 transition-opacity pointer-events-none rounded-r-2xl"
                      style={{
                        background: `radial-gradient(circle at right center, ${mood.accent}, transparent 70%)`
                      }}
                    />

                    {/* Left Details */}
                    <div className="relative z-10 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/40 border"
                          style={{
                            color: mood.accent,
                            borderColor: `${mood.accent}30`
                          }}
                        >
                          {mood.badge}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug group-hover:translate-x-0.5 transition-transform">
                        {mood.name}
                      </h4>
                      <p className="text-[11px] text-white/60 truncate mt-0.5 font-medium">
                        {mood.subtitle}
                      </p>
                    </div>

                    {/* Right Rectangular Action & Icon */}
                    <div className="relative z-10 flex-shrink-0 flex items-center gap-2">
                      <div 
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                        style={{ borderColor: `${mood.accent}30` }}
                      >
                        {renderMoodIcon(mood.icon, mood.accent)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Square Row: Never Heard Before / Discover Unheard Tracks */}
          {settings.searchShowUnheardShelf !== false && (
            <div className="space-y-3 pt-2">
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
              <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 sm:-mx-5 px-4 sm:px-5">
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
                              src={getResolvedCoverArt(track.coverArt)}
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
        </div>
      )}

      {/* Bottom spacer for miniplayer and bottom navigation */}
      <div className="h-28 w-full" aria-hidden="true" />
    </div>
  );
};
