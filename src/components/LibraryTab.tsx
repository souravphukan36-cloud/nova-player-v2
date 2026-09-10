import React, { useState } from 'react';
import { 
  Music, 
  Disc, 
  User, 
  Folder, 
  ListMusic, 
  Tag, 
  Plus, 
  ArrowUpDown, 
  MoreVertical, 
  Play, 
  Heart, 
  Trash2, 
  X, 
  GripVertical,
  Check,
  ChevronRight
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track, Playlist, LibrarySubTab, SortOption, SortDirection } from '../types';
import { sanitizeText } from '../utils/security';
import { isCoverArtImage, DEFAULT_FALLBACK_ART } from '../utils/dynamicColor';

interface LibraryTabProps {
  initialSubTab?: LibrarySubTab;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({ initialSubTab }) => {
  const {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    playTrack,
    toggleFavorite,
    deleteTrack,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    playNext,
    settings,
  } = usePlayer();

  const [activeSubTab, setActiveSubTab] = useState<LibrarySubTab>(
    initialSubTab || settings.libraryDefaultSubTab || 'songs'
  );
  const [sortOption, setSortOption] = useState<SortOption>('title');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  
  // Detail drilldowns
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  // Modals
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const [trackMenuId, setTrackMenuId] = useState<string | null>(null);

  // Music Characters (Vibes & Moods)
  const musicCharacters = [
    {
      id: 'energy',
      name: 'High Energy',
      tagline: 'Driving & Upbeat',
      emoji: '⚡',
      gradient: 'from-amber-600 via-orange-600 to-rose-700',
      matches: (t: Track) => {
        const g = (t.genre || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return g.includes('rock') || g.includes('edm') || g.includes('pop') || g.includes('dance') || title.includes('cyber') || title.includes('fast');
      }
    },
    {
      id: 'latenight',
      name: 'Late Night',
      tagline: 'Soul & Melodic',
      emoji: '🌙',
      gradient: 'from-indigo-900 via-purple-900 to-slate-950',
      matches: (t: Track) => {
        const g = (t.genre || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return g.includes('lo-fi') || g.includes('ambient') || g.includes('soul') || title.includes('night') || title.includes('drift') || title.includes('dream');
      }
    },
    {
      id: 'acoustic',
      name: 'Acoustic Strings',
      tagline: 'Pure & Organic',
      emoji: '🎸',
      gradient: 'from-emerald-800 via-teal-900 to-neutral-950',
      matches: (t: Track) => {
        const g = (t.genre || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return g.includes('acoustic') || g.includes('folk') || g.includes('classical') || title.includes('unplugged') || title.includes('guitar');
      }
    },
    {
      id: 'rain',
      name: 'Rain & Lo-Fi',
      tagline: 'Atmospheric Chill',
      emoji: '🌧️',
      gradient: 'from-cyan-900 via-blue-950 to-neutral-950',
      matches: (t: Track) => {
        const g = (t.genre || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return g.includes('chill') || g.includes('ambient') || title.includes('rain') || title.includes('cloud') || title.includes('mist');
      }
    },
    {
      id: 'bass',
      name: '8D Sub-Bass',
      tagline: 'Club & Drops',
      emoji: '💥',
      gradient: 'from-fuchsia-900 via-purple-950 to-black',
      matches: (t: Track) => {
        const g = (t.genre || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return g.includes('bass') || g.includes('electronic') || title.includes('cyber') || title.includes('orbit') || title.includes('drop');
      }
    },
    {
      id: 'zen',
      name: 'Zen Healing',
      tagline: 'Peace & Serenity',
      emoji: '🧘',
      gradient: 'from-teal-900 via-emerald-950 to-black',
      matches: (t: Track) => {
        const g = (t.genre || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        return g.includes('healing') || g.includes('ambient') || title.includes('peace') || title.includes('zen') || title.includes('forest');
      }
    },
    {
      id: 'folk',
      name: 'Heritage Folk',
      tagline: 'Regional & Assamese',
      emoji: '🥁',
      gradient: 'from-rose-900 via-red-950 to-black',
      matches: (t: Track) => {
        const a = (t.artist || '').toLowerCase();
        const g = (t.genre || '').toLowerCase();
        return a.includes('sourav') || a.includes('zubeen') || a.includes('phukan') || g.includes('folk') || g.includes('bihu');
      }
    },
  ];

  const subTabs: { id: LibrarySubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'songs', label: 'Songs', icon: Music },
    { id: 'albums', label: 'Albums', icon: Disc },
    { id: 'artists', label: 'Artists', icon: User },
    { id: 'genres', label: 'Genres', icon: Tag },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
  ];

  // Sorting
  const sortedTracks = [...tracks].sort((a, b) => {
    let cmp = 0;
    if (sortOption === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortOption === 'artist') {
      cmp = a.artist.localeCompare(b.artist);
    } else if (sortOption === 'dateAdded') {
      cmp = (b.dateAdded || 0) - (a.dateAdded || 0);
    } else if (sortOption === 'duration') {
      cmp = a.duration - b.duration;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const activeCharObj = musicCharacters.find(c => c.id === selectedCharacter);
  const displayedTracks = selectedCharacter && activeCharObj 
    ? sortedTracks.filter(activeCharObj.matches)
    : sortedTracks;

  // Groupings
  const albums = (Array.from(new Set(tracks.map(t => t.album))) as string[]).map(albumName => {
    const albumTracks = tracks.filter(t => t.album === albumName);
    return {
      name: albumName,
      artist: albumTracks[0]?.artist || 'Various Artists',
      coverArt: albumTracks[0]?.coverArt || '',
      tracks: albumTracks,
      count: albumTracks.length,
    };
  });

  const artists = (Array.from(new Set(tracks.map(t => t.artist))) as string[]).map(artistName => {
    const artistTracks = tracks.filter(t => t.artist === artistName);
    return {
      name: artistName,
      coverArt: artistTracks[0]?.coverArt || '',
      tracks: artistTracks,
      count: artistTracks.length,
    };
  });

  const genres = (Array.from(new Set(tracks.map(t => t.genre))) as string[]).map(genreName => {
    const genreTracks = tracks.filter(t => t.genre === genreName);
    return {
      name: genreName,
      tracks: genreTracks,
      count: genreTracks.length,
    };
  });

  const folders = (Array.from(new Set(tracks.map(t => t.folder))) as string[]).map(folderPath => {
    const folderTracks = tracks.filter(t => t.folder === folderPath);
    return {
      path: folderPath,
      tracks: folderTracks,
      count: folderTracks.length,
    };
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(newPlaylistName, 50);
    if (cleanName) {
      createPlaylist(cleanName);
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="space-y-4 pb-36 px-5 select-none animate-in fade-in duration-200">
      {/* Horizontal Sub-Tabs (Samsung Music Pill Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {subTabs.map(({ id, label }) => {
          const isActive = activeSubTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveSubTab(id);
                setSelectedAlbum(null);
                setSelectedArtist(null);
                setSelectedGenre(null);
                setSelectedFolder(null);
                setSelectedPlaylist(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'text-black font-extrabold shadow-md scale-105'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              style={{ backgroundColor: isActive ? settings.accentColor : undefined }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* First Row: Characters of Music (Vibes & Moods Square Boxes) */}
      {settings.libraryShowCharacterGrid !== false && !selectedAlbum && !selectedArtist && !selectedGenre && !selectedFolder && !selectedPlaylist && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <span>Characters of Music</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-normal">Vibes</span>
            </h3>
            {selectedCharacter && (
              <button
                onClick={() => setSelectedCharacter(null)}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1.5 -mx-5 px-5">
            {musicCharacters.map((char) => {
              const isSelected = selectedCharacter === char.id;
              const matchingCount = tracks.filter(char.matches).length;
              return (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedCharacter(isSelected ? null : char.id);
                  }}
                  className={`flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-3 flex flex-col justify-between cursor-pointer border transition-all ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 scale-105 shadow-xl'
                      : 'border-white/10 hover:border-white/25 active:scale-95'
                  } bg-gradient-to-br ${char.gradient}`}
                >
                  {/* Top row: Emoji & Count */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{char.emoji}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-white/90 font-mono font-bold">
                      {matchingCount}
                    </span>
                  </div>

                  {/* Bottom info */}
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight drop-shadow-md">{char.name}</h4>
                    <p className="text-[9px] text-white/70 line-clamp-1 leading-tight mt-0.5">{char.tagline}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Character Filter Banner */}
          {selectedCharacter && activeCharObj && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{activeCharObj.emoji}</span>
                <span className="font-bold">{activeCharObj.name} ({displayedTracks.length} tracks)</span>
              </div>
              <div className="flex items-center gap-2">
                {displayedTracks.length > 0 && (
                  <button
                    onClick={() => playTrack(displayedTracks[0], displayedTracks)}
                    className="px-2.5 py-1 rounded-full bg-emerald-500 text-black font-extrabold text-[10px] active:scale-95 shadow"
                  >
                    Play All
                  </button>
                )}
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="p-1 text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sort & Count Header Bar */}
      <div className="flex items-center justify-between py-1 text-xs text-white/60">
        <span>
          {activeSubTab === 'songs' && `${displayedTracks.length} Songs${selectedCharacter ? ' (Filtered)' : ''}`}
          {activeSubTab === 'albums' && `${albums.length} Albums`}
          {activeSubTab === 'artists' && `${artists.length} Artists`}
          {activeSubTab === 'genres' && `${genres.length} Genres`}
          {activeSubTab === 'folders' && `${folders.length} Folders`}
          {activeSubTab === 'playlists' && `${playlists.length} Playlists`}
        </span>

        {activeSubTab === 'songs' && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3 h-3 text-white/40" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
            >
              <option value="title">Name (A-Z)</option>
              <option value="dateAdded">Date Added</option>
              <option value="duration">Duration</option>
              <option value="artist">Artist</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-white/10 text-[10px] font-bold uppercase"
            >
              {sortDir}
            </button>
          </div>
        )}

        {activeSubTab === 'playlists' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-black shadow-md"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        )}
      </div>

      {/* Detail drilldown back button if viewing specific album/artist/genre/folder/playlist */}
      {(selectedAlbum || selectedArtist || selectedGenre || selectedFolder || selectedPlaylist) && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/10 mb-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-white/50">Viewing Filter</span>
            <h3 className="text-sm font-bold text-white">
              {selectedAlbum || selectedArtist || selectedGenre || selectedFolder || selectedPlaylist?.name}
            </h3>
          </div>
          <button
            onClick={() => {
              setSelectedAlbum(null);
              setSelectedArtist(null);
              setSelectedGenre(null);
              setSelectedFolder(null);
              setSelectedPlaylist(null);
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            Back to All
          </button>
        </div>
      )}

      {/* 1. SONGS SUBTAB */}
      {activeSubTab === 'songs' && (
        <div className="space-y-1">
          {displayedTracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors group ${
                  isCurrent ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                }`}
              >
                <div
                  onClick={() => playTrack(track, displayedTracks)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex-shrink-0 shadow-md overflow-hidden relative flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: track.coverArt }}
                  >
                    {isCoverArtImage(track.coverArt) ? (
                      <img 
                        src={track.coverArt} 
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
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-white/40">{formatTime(track.duration)}</span>

                  <button
                    onClick={() => toggleFavorite(track.id)}
                    className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                      track.isFavorite ? 'text-rose-500' : 'text-white/40 hover:text-white'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setTrackMenuId(trackMenuId === track.id ? null : track.id)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {trackMenuId === track.id && (
                      <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-neutral-900 border border-white/15 p-1.5 shadow-2xl text-xs animate-in zoom-in-95">
                        <button
                          onClick={() => {
                            playNext(track);
                            setTrackMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white"
                        >
                          Play Next
                        </button>
                        <button
                          onClick={() => {
                            setAddToPlaylistTrack(track);
                            setTrackMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white"
                        >
                          Add to Playlist...
                        </button>
                        {tracks.length > 1 && (
                          <button
                            onClick={() => {
                              deleteTrack(track.id);
                              setTrackMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400"
                          >
                            Delete Track
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. ALBUMS SUBTAB */}
      {activeSubTab === 'albums' && (
        <div className="grid grid-cols-2 gap-3">
          {albums.map((album) => (
            <div
              key={album.name}
              onClick={() => {
                playTrack(album.tracks[0], album.tracks);
              }}
              className="p-3 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-white/20 cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div 
                className="w-full aspect-square rounded-xl mb-2.5 shadow-md relative overflow-hidden flex items-center justify-center text-white font-bold"
                style={{ background: album.coverArt }}
              >
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-black shadow-lg"
                    style={{ backgroundColor: settings.accentColor }}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{album.name}</h4>
              <p className="text-[11px] text-white/50 truncate">{album.artist} • {album.count} tracks</p>
            </div>
          ))}
        </div>
      )}

      {/* 3. ARTISTS SUBTAB */}
      {activeSubTab === 'artists' && (
        <div className="space-y-2">
          {artists.map((artist) => (
            <div
              key={artist.name}
              onClick={() => playTrack(artist.tracks[0], artist.tracks)}
              className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-white/20 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                  style={{ background: artist.coverArt }}
                >
                  <User className="w-6 h-6 text-white/80" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{artist.name}</h4>
                  <p className="text-[11px] text-white/50">{artist.count} songs available</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </div>
          ))}
        </div>
      )}

      {/* 4. GENRES SUBTAB */}
      {activeSubTab === 'genres' && (
        <div className="grid grid-cols-2 gap-3">
          {genres.map((genre) => (
            <div
              key={genre.name}
              onClick={() => playTrack(genre.tracks[0], genre.tracks)}
              className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 hover:border-white/20 cursor-pointer transition-all"
            >
              <Tag className="w-5 h-5 mb-2" style={{ color: settings.accentColor }} />
              <h4 className="text-sm font-bold text-white">{genre.name}</h4>
              <p className="text-xs text-white/50 mt-0.5">{genre.count} songs</p>
            </div>
          ))}
        </div>
      )}

      {/* 5. FOLDERS SUBTAB */}
      {activeSubTab === 'folders' && (
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.path}
              onClick={() => playTrack(folder.tracks[0], folder.tracks)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-white/20 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-black flex-shrink-0"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  <Folder className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{folder.path.split('/').pop() || 'Music'}</h4>
                  <p className="text-[11px] text-white/50 truncate font-mono">{folder.path} ({folder.count} tracks)</p>
                </div>
              </div>
              <Play className="w-4 h-4 text-white/40 hover:text-white" />
            </div>
          ))}
        </div>
      )}

      {/* 6. PLAYLISTS SUBTAB */}
      {activeSubTab === 'playlists' && (
        <div className="space-y-3">
          {/* Selected playlist tracks detail view */}
          {selectedPlaylist ? (
            <div className="p-4 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg"
                    style={{ background: selectedPlaylist.coverArt }}
                  >
                    <ListMusic className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedPlaylist.name}</h3>
                    <p className="text-xs text-white/50">{selectedPlaylist.description || `${selectedPlaylist.trackIds.length} songs`}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Playlist Tracks list */}
              <div className="space-y-1 pt-2 border-t border-white/10">
                {selectedPlaylist.trackIds.length === 0 ? (
                  <p className="text-xs text-white/40 py-6 text-center">No tracks in this playlist yet. Add songs using track menus.</p>
                ) : (
                  selectedPlaylist.trackIds.map((trId, idx) => {
                    const tr = tracks.find(t => t.id === trId);
                    if (!tr) return null;
                    return (
                      <div
                        key={trId}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5"
                      >
                        <div
                          onClick={() => {
                            const plTracks = selectedPlaylist.trackIds
                              .map(id => tracks.find(t => t.id === id))
                              .filter(Boolean) as Track[];
                            playTrack(tr, plTracks);
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                        >
                          <span className="w-4 text-xs text-white/40 font-mono">{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{tr.title}</h4>
                            <p className="text-[11px] text-white/50 truncate">{tr.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeTrackFromPlaylist(selectedPlaylist.id, trId)}
                            className="p-1 text-white/40 hover:text-rose-400"
                            title="Remove from playlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            // All playlists list
            <div className="grid grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylist(pl)}
                  className="p-3.5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-white/20 cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                  <div 
                    className="w-full aspect-square rounded-xl mb-2.5 shadow-md relative overflow-hidden flex items-center justify-center text-white"
                    style={{ background: pl.coverArt }}
                  >
                    <ListMusic className="w-8 h-8 text-white/90" />
                    {pl.isBuiltIn && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                        BUILT-IN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-1">
                      <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
                      <p className="text-[11px] text-white/50 truncate">{pl.trackIds.length} tracks</p>
                    </div>
                    {!pl.isBuiltIn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(pl.id);
                        }}
                        className="p-1 text-white/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <form 
            onSubmit={handleCreatePlaylist}
            className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/15 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">New Playlist</h3>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              maxLength={50}
              placeholder="Playlist Name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value.slice(0, 50))}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black shadow-lg"
                style={{ backgroundColor: settings.accentColor }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Track to Playlist */}
      {addToPlaylistTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Add to Playlist</h3>
                <p className="text-xs text-white/50 truncate max-w-[220px]">
                  {addToPlaylistTrack.title}
                </p>
              </div>
              <button 
                onClick={() => setAddToPlaylistTrack(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
              {playlists.map((pl) => {
                const has = pl.trackIds.includes(addToPlaylistTrack.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (!has) {
                        addTrackToPlaylist(pl.id, addToPlaylistTrack.id);
                      }
                      setAddToPlaylistTrack(null);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-left transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{pl.name}</h4>
                      <p className="text-[10px] text-white/50">{pl.trackIds.length} tracks</p>
                    </div>
                    {has ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-white/50">+ Add</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for miniplayer and bottom navigation */}
      <div className="h-28 w-full" aria-hidden="true" />
    </div>
  );
};
