import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Music, 
  Sparkles, 
  ChevronRight,
  Heart,
  Radio,
  Disc3,
  Sliders,
  Flame,
  CloudRain,
  Compass,
  Mic2,
  Check,
  Bell,
  X,
  Star
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { isCoverArtImage, DEFAULT_FALLBACK_ART, getResolvedCoverArt } from '../utils/dynamicColor';
import { DailyLivePoster } from './DailyLivePoster';

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
    toggleFavorite,
    setNowPlayingOpen,
    setCustomizerOpen,
    settings,
  } = usePlayer();

  const [announcement, setAnnouncement] = useState<{ 
    title?: string; 
    text: string; 
    imageUrl?: string; 
    videoUrl?: string;
    mediaType?: 'image' | 'video';
    linkUrl?: string; 
    enabled: boolean; 
    type?: string; 
    wishText?: string;
    eventDate?: string;
    themeColor?: string;
  } | null>(null);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = () => {
      fetch('/api/announcement')
        .then(res => res.json())
        .then(data => {
          if (data?.announcement?.enabled && (data.announcement.text || data.announcement.imageUrl || data.announcement.videoUrl || data.announcement.wishText)) {
            setAnnouncement(data.announcement);
          }
        })
        .catch(() => {});
    };

    fetchAnnouncement();
    const interval = setInterval(fetchAnnouncement, 6000);
    const handleFocus = () => fetchAnnouncement();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const shelves = settings.homeShelves;
  const isPortrait = shelves.cardStyle === 'portrait';
  const isCompact = shelves.cardStyle === 'compact';

  // Recently played tracks (first 6)
  const recentlyPlayed = useMemo(() => [...tracks].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0)).slice(0, 6), [tracks]);

  // Quick picks
  const quickPicks = useMemo(() => tracks.slice(0, 8), [tracks]);

  // Artist spotlight tracks (Anuv Jain & The Local Train)
  const spotlightArtist = 'Anuv Jain & The Local Train';
  const artistTracks = useMemo(() => tracks.filter(t => 
    t.artist.toLowerCase().includes('anuv') || 
    t.artist.toLowerCase().includes('local train') ||
    t.artist.toLowerCase().includes('atif')
  ), [tracks]);

  // Rain & Soundscape Mood tracks
  const rainMoodTracks = useMemo(() => tracks.filter(t => 
    t.genre.toLowerCase().includes('ambient') || 
    t.genre.toLowerCase().includes('lo-fi') || 
    t.title.toLowerCase().includes('rain') ||
    t.genre.toLowerCase().includes('acoustic')
  ), [tracks]);

  // Unique albums
  const uniqueAlbums = useMemo(() => {
    const albumMap = new Map<string, Track>();
    tracks.forEach(t => {
      if (!albumMap.has(t.album)) {
        albumMap.set(t.album, t);
      }
    });
    return Array.from(albumMap.values());
  }, [tracks]);

  return (
    <div className="space-y-7 pb-52 px-4 sm:px-6 select-none animate-in fade-in duration-300">

      {/* Live Daily Event & Special Day Master Poster */}
      <DailyLivePoster 
        announcement={announcement} 
        onTrackPlay={(track) => playTrack(track)} 
      />

      {/* Top Quick Navigation Bar & Feed Customizer */}
      <div className="flex items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onNavigateToLibrary('favorites')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>Liked ({tracks.filter(t => t.isFavorite).length})</span>
          </button>
          <button
            onClick={() => onNavigateToLibrary('artists')}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-95"
          >
            Artists
          </button>
          <button
            onClick={() => onNavigateToLibrary('albums')}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-95"
          >
            Albums
          </button>
        </div>

        {/* Prominent Customizer Button */}
        <button
          id="btn-customize-feed"
          onClick={() => setCustomizerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all group active:scale-95 flex-shrink-0"
          style={{ borderColor: `${settings.accentColor}50` }}
          title="Customize Home Feed & Player Style"
        >
          <Sliders className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" style={{ color: settings.accentColor }} />
          <span>Customize Feed</span>
        </button>
      </div>

      {/* 1. RECENTLY PLAYED SHELF (Tall Cards from Photo 3 or Customizable) */}
      {shelves.showRecentlyPlayed && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Recently played</span>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: settings.accentColor }} />
              </h2>
            </div>
            <button 
              onClick={() => onNavigateToLibrary('playlists')}
              className="text-xs font-semibold hover:underline flex items-center gap-0.5 transition-colors"
              style={{ color: settings.accentColor }}
            >
              <span>History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards Carousel */}
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 pt-0.5">
            {recentlyPlayed.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`recent-${track.id}`}
                  onClick={() => playTrack(track, tracks)}
                  className={`flex-shrink-0 group cursor-pointer transition-all duration-300 ${
                    isPortrait ? 'w-44 sm:w-48' : isCompact ? 'w-36' : 'w-40 sm:w-44'
                  }`}
                >
                  {/* Card Artwork Container */}
                  <div 
                    className={`relative w-full rounded-3xl overflow-hidden shadow-xl border border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:-translate-y-1 ${
                      isPortrait ? 'aspect-[3/4]' : 'aspect-square'
                    }`}
                  >
                    <img 
                      src={getResolvedCoverArt(track.coverArt)} 
                      alt={track.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = DEFAULT_FALLBACK_ART;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                    {/* Playing badge */}
                    {isCurrent && isPlaying ? (
                      <div 
                        className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-black text-[9px] font-extrabold tracking-wider animate-pulse shadow-lg"
                        style={{ backgroundColor: settings.accentColor }}
                      >
                        PLAYING
                      </div>
                    ) : null}

                    {/* Format pill */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-black/60 backdrop-blur-md text-white/90 border border-white/15">
                        {track.format}
                      </span>
                    </div>

                    {/* Play hover button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold shadow-2xl transition-transform active:scale-90"
                        style={{ backgroundColor: settings.accentColor }}
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Info text inside card */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className={`text-sm font-bold tracking-tight leading-snug line-clamp-2 ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>
                        {track.title}
                      </h3>
                      <p className="text-xs text-white/70 truncate mt-1 font-medium">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. QUICK PICKS (Grid/Row Carousel matching Photo 3) */}
      {shelves.showQuickPicks && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Quick picks</span>
            </h2>
            <button 
              onClick={() => onNavigateToLibrary('songs')}
              className="text-xs font-semibold hover:underline flex items-center gap-0.5 transition-colors"
              style={{ color: settings.accentColor }}
            >
              <span>More</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5">
            {quickPicks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`quick-${track.id}`}
                  onClick={() => playTrack(track, tracks)}
                  className="w-36 sm:w-40 flex-shrink-0 group cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/10 group-hover:border-white/25 transition-all duration-300 group-hover:-translate-y-1">
                    <img 
                      src={getResolvedCoverArt(track.coverArt)} 
                      alt={track.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = DEFAULT_FALLBACK_ART;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold shadow-xl"
                        style={{ backgroundColor: settings.accentColor }}
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 px-1">
                    <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ARTIST SPOTLIGHT: Thaikkudam Bridge / Atif Aslam (Photo 1) */}
      {shelves.showArtistSpotlight && artistTracks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4" style={{ color: settings.accentColor }} />
              <h2 className="text-xl font-bold tracking-tight text-white">
                {spotlightArtist} & Legends
              </h2>
            </div>
            <button 
              onClick={() => onNavigateToLibrary('artists')}
              className="text-xs font-semibold hover:underline flex items-center gap-0.5 transition-colors"
              style={{ color: settings.accentColor }}
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5">
            {artistTracks.map((track) => (
              <div
                key={`artist-${track.id}`}
                onClick={() => playTrack(track, tracks)}
                className="w-36 sm:w-40 flex-shrink-0 group cursor-pointer"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/10 group-hover:border-white/30 transition-all duration-300">
                  <img 
                    src={track.coverArt || DEFAULT_FALLBACK_ART} 
                    alt={track.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = DEFAULT_FALLBACK_ART;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                      {track.album}
                    </span>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ALBUMS & SINGLES (Photo 1) */}
      {shelves.showAlbumsSingles && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Albums & singles</span>
            </h2>
            <button 
              onClick={() => onNavigateToLibrary('albums')}
              className="text-xs font-semibold hover:underline flex items-center gap-0.5 transition-colors"
              style={{ color: settings.accentColor }}
            >
              <span>Library</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5">
            {uniqueAlbums.map((track) => (
              <div
                key={`album-${track.album}`}
                onClick={() => playTrack(track, tracks)}
                className="w-36 sm:w-40 flex-shrink-0 group cursor-pointer"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/10 group-hover:border-white/30 transition-all duration-300">
                  <img 
                    src={getResolvedCoverArt(track.coverArt)} 
                    alt={track.album} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = DEFAULT_FALLBACK_ART;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/15">
                      Album
                    </span>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <h4 className="text-xs font-bold text-white truncate">{track.album}</h4>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RAIN THERAPY ☘️🌧️ (FOR COZY DAYS AND ENDLESS CUPS OF TEA) (Photo 1) */}
      {shelves.showMoodTherapy && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/60 to-cyan-950/30 border border-emerald-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-emerald-400 animate-bounce" style={{ animationDuration: '2s' }} />
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Rain Therapy ☘️🌧️
                </h2>
              </div>
              <p className="text-[11px] font-bold tracking-widest text-emerald-400/80 uppercase mt-0.5">
                FOR COZY DAYS AND ENDLESS CUPS OF TEA
              </p>
            </div>
            <button 
              onClick={() => onNavigateToLibrary('genres')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Soundscapes
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-1">
            {rainMoodTracks.map((track) => (
              <div
                key={`rain-${track.id}`}
                onClick={() => playTrack(track, tracks)}
                className="w-40 sm:w-44 flex-shrink-0 group cursor-pointer"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/10 group-hover:border-emerald-400/40 transition-all duration-300 group-hover:-translate-y-1">
                  <img 
                    src={getResolvedCoverArt(track.coverArt)} 
                    alt={track.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = DEFAULT_FALLBACK_ART;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                    <span className="text-sm font-extrabold text-white drop-shadow-md">
                      {track.title}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white/70 font-medium">
                    <span>{track.genre}</span>
                    <span>8D Audio</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom spacer for miniplayer and bottom navigation */}
      <div className="h-28 w-full" aria-hidden="true" />
    </div>
  );
};
