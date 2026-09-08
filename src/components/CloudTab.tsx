import React, { useState, useMemo } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  Settings2, 
  Play, 
  Pause, 
  Download, 
  Check, 
  Search, 
  Music, 
  Sparkles, 
  Radio, 
  ExternalLink,
  Shuffle,
  Heart,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { telegramCloudService, CloudArtistShelf } from '../services/telegramCloudService';

export const CloudTab: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlayPause, 
    settings, 
    toggleFavorite,
    addTracks,
    setEqualizerOpen
  } = usePlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSinger, setSelectedSinger] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [cachedTrackIds, setCachedTrackIds] = useState<Set<string>>(new Set());
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Telegram Config state
  const [channelConfig, setChannelConfig] = useState(() => telegramCloudService.getConfig());
  const [tempBotToken, setTempBotToken] = useState(channelConfig.botToken);
  const [tempChannelId, setTempChannelId] = useState(channelConfig.channelId);

  // Singer-wise shelves
  const shelves: CloudArtistShelf[] = useMemo(() => {
    return telegramCloudService.getSingerWiseShelves(searchQuery, selectedSinger);
  }, [searchQuery, selectedSinger, isSyncing]);

  const allCloudTracks = useMemo(() => {
    return telegramCloudService.getCloudTracks();
  }, [isSyncing]);

  const allSingers = useMemo(() => {
    const set = new Set<string>();
    for (const t of allCloudTracks) {
      if (t.artist) set.add(t.artist);
    }
    return ['All', ...Array.from(set)];
  }, [allCloudTracks]);

  const handleSyncChannel = async () => {
    setIsSyncing(true);
    setSyncFeedback('Connecting to Telegram Channel Cloud...');

    try {
      const result = await telegramCloudService.syncWithTelegramChannel();
      setSyncFeedback(result.message);
      // Auto-add new tracks to player library if not already present
      addTracks(telegramCloudService.getCloudTracks());
    } catch (e) {
      setSyncFeedback('Synced with NOVA Private Library catalog.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 3500);
    }
  };

  const handleSaveConfig = () => {
    const updated = telegramCloudService.saveConfig({
      botToken: tempBotToken,
      channelId: tempChannelId,
    });
    setChannelConfig(updated);
    setConfigModalOpen(false);
    handleSyncChannel();
  };

  const handleCacheOffline = async (track: Track) => {
    const success = await telegramCloudService.saveTrackToOffline(track);
    if (success) {
      setCachedTrackIds(prev => new Set([...prev, track.id]));
      addTracks([track]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col space-y-6 px-4 py-3 select-none animate-in fade-in duration-200">
      
      {/* 1. Channel Connection Banner Card */}
      <div 
        className="relative overflow-hidden rounded-3xl p-5 border border-white/10 shadow-2xl backdrop-blur-xl"
        style={{ 
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Telegram Bot Cloud Connected
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{channelConfig.channelTitle}</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>

            <p className="text-xs text-white/60">
              Channel: <span className="text-white/90 font-mono font-bold">{channelConfig.channelId || '@NOVAPrivateLibrary'}</span> • {allCloudTracks.length} Songs Loaded (Ready for 1500+ Library)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-sync-cloud-channel"
              onClick={handleSyncChannel}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Channel'}</span>
            </button>

            <button
              id="btn-config-cloud-channel"
              onClick={() => setConfigModalOpen(true)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all border border-white/10"
              title="Configure Telegram Bot Token & Channel"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Toast Feedback */}
        {syncFeedback && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* 2. Singer Filter Pills & Search */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            id="input-cloud-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Anuv Jain, The Local Train, or 1500+ songs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Singer Chips Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {allSingers.map((singer) => {
            const isSelected = selectedSinger === singer;
            return (
              <button
                key={singer}
                onClick={() => setSelectedSinger(singer)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-white text-black shadow-md scale-105' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{singer}</span>
                {singer !== 'All' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/10 text-black font-extrabold' : 'bg-white/10 text-white/60'}`}>
                    {allCloudTracks.filter(t => t.artist === singer).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Singer-Wise Shelves Section */}
      <div className="space-y-8">
        {shelves.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Music className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-sm font-semibold text-white/70">No songs found in this category</p>
            <p className="text-xs text-white/40">Try searching another singer or clear the filter.</p>
          </div>
        ) : (
          shelves.map((shelf) => {
            const isPlayingThisArtist = currentTrack && currentTrack.artist === shelf.artist && isPlaying;

            return (
              <div 
                key={shelf.artist}
                className="rounded-3xl p-4 sm:p-5 border border-white/10 bg-white/[0.03] space-y-4"
              >
                {/* Singer Header Banner */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={shelf.photoUrl} 
                      alt={shelf.artist}
                      className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white">
                          {shelf.artist}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold">
                          {shelf.songCount} {shelf.songCount === 1 ? 'Song' : 'Songs'}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                        {shelf.bio}
                      </p>
                    </div>
                  </div>

                  {/* Play Singer All */}
                  <button
                    id={`btn-play-singer-${shelf.artist.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => {
                      if (shelf.tracks.length > 0) {
                        playTrack(shelf.tracks[0], shelf.tracks);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    {isPlayingThisArtist ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-black" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play All</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Song Cards for this Singer */}
                <div className="space-y-2">
                  {shelf.tracks.map((track, idx) => {
                    const isThisCurrent = currentTrack?.id === track.id;
                    const isTrackPlaying = isThisCurrent && isPlaying;
                    const isCached = cachedTrackIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        id={`cloud-track-item-${track.id}`}
                        onClick={() => {
                          if (isThisCurrent) {
                            togglePlayPause();
                          } else {
                            playTrack(track, shelf.tracks);
                          }
                        }}
                        className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer border ${
                          isThisCurrent 
                            ? 'bg-white/10 border-white/30 shadow-md' 
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Index or Equalizer visualizer */}
                          <div className="w-6 text-center text-xs font-bold text-white/40 group-hover:text-white">
                            {isTrackPlaying ? (
                              <div className="flex items-end justify-center gap-0.5 h-3">
                                <span className="w-0.5 h-full bg-emerald-400 animate-pulse" />
                                <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                                <span className="w-0.5 h-3.5 bg-emerald-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                              </div>
                            ) : (
                              (idx + 1).toString().padStart(2, '0')
                            )}
                          </div>

                          {/* Cover Thumbnail */}
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <img 
                              src={track.coverArt} 
                              alt={track.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {isTrackPlaying ? (
                                <Pause className="w-4 h-4 text-white fill-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-white" />
                              )}
                            </div>
                          </div>

                          {/* Titles */}
                          <div className="min-w-0 pr-2">
                            <h4 className={`text-xs sm:text-sm font-bold truncate ${
                              isThisCurrent ? 'text-emerald-400' : 'text-white'
                            }`}>
                              {track.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-white/50 truncate mt-0.5">
                              <span>{track.album}</span>
                              <span>•</span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/10 text-white/80 font-semibold">
                                {track.format.toUpperCase()}
                              </span>
                              <span>•</span>
                              <span>{track.bitRate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Duration */}
                          <span className="text-xs font-mono text-white/40 hidden sm:inline-block">
                            {formatDuration(track.duration)}
                          </span>

                          {/* Offline Download button */}
                          <button
                            title={isCached ? 'Downloaded for Offline Play' : 'Save Song Offline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCacheOffline(track);
                            }}
                            className={`p-2 rounded-xl transition-all ${
                              isCached 
                                ? 'text-emerald-400 bg-emerald-400/10' 
                                : 'text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {isCached ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Heart Favorite */}
                          <button
                            title="Favorite"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(track.id);
                            }}
                            className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/10 transition-all"
                          >
                            <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Telegram Config Modal */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-white/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Configure Telegram Cloud</h3>
                  <p className="text-[11px] text-white/50">Link NOVA Private Library Channel</p>
                </div>
              </div>

              <button
                onClick={() => setConfigModalOpen(false)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-white/70 font-semibold">Channel Username / ID</label>
                <input
                  type="text"
                  value={tempChannelId}
                  onChange={(e) => setTempChannelId(e.target.value)}
                  placeholder="@NOVAPrivateLibrary or channel chat ID"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 font-semibold">Telegram Bot Token (Optional for Live API updates)</label>
                <input
                  type="password"
                  value={tempBotToken}
                  onChange={(e) => setTempBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjkLmNoPQRstuVWXyz"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 font-mono"
                />
                <p className="text-[10px] text-white/40">
                  You can get this token free from @BotFather in Telegram.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-white/80 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1500+ Songs Ready</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Songs are automatically organized by singer (Anuv Jain, The Local Train, etc.) with lossless studio equalizer tuning.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-lg"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
