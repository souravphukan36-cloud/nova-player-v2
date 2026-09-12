import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  Track, 
  Playlist, 
  EqualizerState, 
  EQPreset, 
  ShuffleMode, 
  RepeatMode, 
  SettingsState 
} from '../types';
import { DEFAULT_TRACKS, INITIAL_PLAYLISTS } from '../data/defaultTracks';
import { audioEngine } from '../services/audioEngine';
import { 
  getAllStoredTracks, 
  deleteStoredTrack, 
  clearAllAudioStorage, 
  saveTrackWithAudio,
  getAllDownloadedTrackIds,
  downloadAndSaveTrackOffline
} from '../services/storageDb';
import { notificationService } from '../services/notificationService';
import { telegramCloudService } from '../services/telegramCloudService';
import { lyricsService } from '../services/lyricsService';

interface PlayerContextType {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: ShuffleMode;
  repeat: RepeatMode;
  queue: Track[];
  queueIndex: number;
  equalizer: EqualizerState;
  settings: SettingsState;
  sleepTimer: { minutes: number | null; remainingSeconds: number | null; endOfTrack: boolean };
  
  // UI states
  nowPlayingOpen: boolean;
  setNowPlayingOpen: (open: boolean) => void;
  equalizerOpen: boolean;
  setEqualizerOpen: (open: boolean) => void;
  queueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  lyricsOpen: boolean;
  setLyricsOpen: (open: boolean) => void;
  lockScreenOpen: boolean;
  setLockScreenOpen: (open: boolean) => void;
  notificationShadeOpen: boolean;
  setNotificationShadeOpen: (open: boolean) => void;
  sleepTimerOpen: boolean;
  setSleepTimerOpen: (open: boolean) => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  playlistModalOpen: boolean;
  setPlaylistModalOpen: (open: boolean) => void;
  customizerOpen: boolean;
  setCustomizerOpen: (open: boolean) => void;
  carModeOpen: boolean;
  setCarModeOpen: (open: boolean) => void;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleFavorite: (trackId: string) => void;
  setShuffle: (mode: ShuffleMode) => void;
  setRepeat: (mode: RepeatMode) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  
  // Equalizer
  setEQPreset: (preset: EQPreset) => void;
  setEQBand: (bandIndex: number, gain: number) => void;
  setEQBandMode: (mode: '5-band' | '10-band') => void;
  setBassBoost: (val: number) => void;
  setReverb: (val: number) => void;
  setStereoWidening: (val: number) => void;
  toggleDolbyAtmos: () => void;
  setDolbyProfile: (profile: 'cinema' | 'music' | 'vocal') => void;
  setDolbyDialogueClarity: (val: number) => void;
  toggleEightDAudio: () => void;
  setEightDSpeed: (speed: 'slow' | 'medium' | 'fast') => void;
  setEightDDistance: (dist: 'near' | 'medium' | 'far') => void;
  setEightDMode: (mode: 'orbit' | 'pendulum') => void;
  toggleEQEnabled: () => void;

  // Sleep Timer
  startSleepTimer: (minutes: number, endOfTrack?: boolean) => void;
  cancelSleepTimer: () => void;

  // Playlists & Tracks
  addTracks: (newTracks: Track[]) => void;
  deleteTrack: (trackId: string) => void;
  downloadTrack: (track: Track) => Promise<boolean>;
  deleteDownloadedTrack: (trackId: string) => Promise<void>;
  downloadedTrackIds: Set<string>;
  isDownloading: string | null;
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, startIndex: number, endIndex: number) => void;
  linkAudioFileToTrack: (trackId: string, file: File) => Promise<void>;

  // Settings
  updateTheme: (theme: SettingsState['theme']) => void;
  updateAccentColor: (color: string) => void;
  updateCrossfade: (secs: number) => void;
  toggleGapless: () => void;
  clearCache: () => void;
  updateSettings: (partial: Partial<SettingsState>) => void;
}

const EQ_PRESETS_5: Record<EQPreset, number[]> = {
  'Normal': [0, 0, 0, 0, 0],
  'Bass Boost': [6, 4, 1, 0, 0],
  'Rock': [5, 3, -1, 3, 5],
  'Pop': [-1, 2, 5, 2, -2],
  'Jazz': [4, 2, -2, 2, 4],
  'Classical': [5, 3, -1, 2, 4],
  'EDM': [6, 3, -1, 4, 5],
  'Vocal': [-2, 1, 4, 3, 1],
  'Custom': [0, 0, 0, 0, 0],
};

const EQ_PRESETS_10: Record<EQPreset, number[]> = {
  'Normal': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [8, 7, 5, 3, 1, 0, 0, 1, 2, 2],
  'Rock': [5, 4, 3, -1, -2, 1, 3, 4, 5, 5],
  'Pop': [-1, 1, 2, 4, 5, 3, 2, 0, -1, -2],
  'Jazz': [4, 3, 2, 1, -1, -1, 1, 2, 3, 4],
  'Classical': [5, 4, 3, 1, -1, 1, 2, 3, 4, 4],
  'EDM': [8, 7, 5, 1, -1, 2, 4, 5, 6, 6],
  'Vocal': [-3, -2, 0, 2, 5, 5, 4, 3, 1, 0],
  'Custom': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'amoled',
  accentColor: '#10B981', // Emerald Nature Accent
  crossfadeSecs: 2,
  gapless: true,
  highQuality: true,
  supportedFormats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  scanFolders: ['/Storage/emulated/0/Music', '/Storage/emulated/0/Download'],
  autoScanOnStartup: true,
  soundAliveSpectrum: false,
  showTopStatusBar: true,
  topBarRedAccent: true,
  homeShowResumeCard: true,
  homeShowRecent: true,
  homeShowMostPlayed: true,
  libraryDefaultSubTab: 'songs',
  libraryViewMode: 'list',
  libraryShowCharacterGrid: true,
  searchInstantFilter: true,
  searchShowUnheardShelf: true,
  systemNotificationsEnabled: true,
  transitionDelaySecs: 0,
  autoAdvanceLoop: true,
  homeShelves: {
    showRecentlyPlayed: true,
    showQuickPicks: true,
    showMoodTherapy: true,
    showArtistSpotlight: true,
    showAlbumsSingles: true,
    showAllTracks: true,
    cardStyle: 'portrait',
  },
  nowPlayingConfig: {
    layoutStyle: 'immersive-backdrop',
    showLyricsLine: true,
    showVolumeBar: true,
    infiniteAutoplay: true,
  },
};

const DEFAULT_EQ: EqualizerState = {
  enabled: true,
  preset: 'Bass Boost',
  bandMode: '10-band',
  bands: [8, 7, 5, 3, 1, 0, 0, 1, 2, 2],
  bassBoost: 65,
  reverb: 20,
  stereoWidening: 45,
  dolbyAtmos: true,
  dolbyProfile: 'cinema',
  dolbyDialogueClarity: 70,
  eightDAudio: false,
  eightDSpeed: 'medium',
  eightDDistance: 'medium',
  eightDMode: 'orbit',
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerTimeContext = createContext<number>(0);

export const usePlaybackTime = () => {
  return useContext(PlayerTimeContext);
};

const isBannedTrack = (t: Track): boolean => {
  if (!t) return true;
  if (/^nova-track-\d+$/i.test(t.id)) return true;
  const combined = `${t.title || ''} ${t.artist || ''} ${t.album || ''} ${t.folder || ''}`.toLowerCase();
  return (
    combined.includes('samsung') ||
    combined.includes('ringtone') ||
    combined.includes('over the horizon') ||
    combined.includes('notification sound')
  );
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Saved state from localStorage with strict exclusion of un-uploaded demo tracks
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('nova_tracks');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 1. Purge legacy demo tracks that the user didn't upload to their Telegram bot
          const isLegacyDemo = (id: string) =>
            id.startsWith('bitchord-') ||
            id.startsWith('cloud-anuv-') ||
            id.startsWith('cloud-local-train-') ||
            id === 'anuv-jain-baarishein' ||
            id === 'anuv-jain-husn' ||
            id === 'anuv-jain-alag-aasmaan' ||
            id === 'anuv-jain-mishri' ||
            id === 'local-train-choo-lo' ||
            id === 'local-train-aaoge-tum-kabhi';

          parsed = parsed.filter((t: Track) => !isBannedTrack(t) && !isLegacyDemo(t.id));

          // 2. Ensure all verified real Telegram tracks have up-to-date coverArt, audioUrl, and metadata
          const defaultMap = new Map(DEFAULT_TRACKS.map(dt => [dt.id, dt]));
          const updated = parsed.map((t: Track) => {
            const fresh = defaultMap.get(t.id);
            return fresh ? { ...t, ...fresh, playCount: t.playCount ?? fresh.playCount, isFavorite: t.isFavorite ?? fresh.isFavorite } : t;
          });
          const existingIds = new Set(updated.map((t: Track) => t.id));
          const missingDefaults = DEFAULT_TRACKS.filter(dt => !existingIds.has(dt.id));
          const combined = missingDefaults.length > 0 ? [...missingDefaults, ...updated] : updated;
          if (combined.length > 0) {
            localStorage.setItem('nova_tracks', JSON.stringify(combined));
            return combined;
          }
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_TRACKS;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('nova_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_PLAYLISTS;
  });

  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem('nova_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          homeShelves: {
            ...DEFAULT_SETTINGS.homeShelves,
            ...(parsed.homeShelves || {})
          },
          nowPlayingConfig: {
            ...DEFAULT_SETTINGS.nowPlayingConfig,
            ...(parsed.nowPlayingConfig || {})
          }
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [equalizer, setEqualizer] = useState<EqualizerState>(() => {
    try {
      const saved = localStorage.getItem('nova_equalizer');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_EQ,
          ...parsed,
          bandMode: '10-band',
          bands: Array.isArray(parsed.bands) && parsed.bands.length === 10
            ? parsed.bands
            : DEFAULT_EQ.bands
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_EQ;
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const currentTimeRef = useRef<number>(0);
  const [duration, setDuration] = useState<number>(DEFAULT_TRACKS[0].duration);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<ShuffleMode>('off');
  const [repeat, setRepeat] = useState<RepeatMode>('all');

  const [queue, setQueue] = useState<Track[]>(DEFAULT_TRACKS);
  const [queueIndex, setQueueIndex] = useState<number>(0);

  // Sleep timer
  const [sleepTimer, setSleepTimer] = useState<{
    minutes: number | null;
    remainingSeconds: number | null;
    endOfTrack: boolean;
  }>({
    minutes: null,
    remainingSeconds: null,
    endOfTrack: false,
  });

  // UI Modals
  const [nowPlayingOpen, setNowPlayingOpen] = useState<boolean>(false);
  const [equalizerOpen, setEqualizerOpen] = useState<boolean>(false);
  const [queueOpen, setQueueOpen] = useState<boolean>(false);
  const [lyricsOpen, setLyricsOpen] = useState<boolean>(false);
  const [lockScreenOpen, setLockScreenOpen] = useState<boolean>(false);
  const [notificationShadeOpen, setNotificationShadeOpen] = useState<boolean>(false);
  const [sleepTimerOpen, setSleepTimerOpen] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState<boolean>(false);
  const [customizerOpen, setCustomizerOpen] = useState<boolean>(false);
  const [carModeOpen, setCarModeOpen] = useState<boolean>(false);
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Load offline stored track IDs on startup
  useEffect(() => {
    getAllDownloadedTrackIds().then(ids => {
      setDownloadedTrackIds(ids);
      // Mark matching tracks as downloaded
      setTracks(prev => prev.map(t => ids.has(t.id) ? { ...t, isDownloaded: true } : t));
    }).catch(() => {});
  }, []);

  // Offline track download handler
  const downloadTrack = async (track: Track): Promise<boolean> => {
    setIsDownloading(track.id);
    try {
      const ok = await downloadAndSaveTrackOffline(track, true);
      if (ok) {
        setDownloadedTrackIds(prev => new Set([...prev, track.id]));
        setTracks(prev => prev.map(t => t.id === track.id ? { ...t, isDownloaded: true } : t));
      }
      return ok;
    } catch (err) {
      console.warn('Failed to download track offline:', err);
      return false;
    } finally {
      setIsDownloading(null);
    }
  };

  const deleteDownloadedTrack = async (trackId: string): Promise<void> => {
    try {
      await deleteStoredTrack(trackId);
      setDownloadedTrackIds(prev => {
        const copy = new Set(prev);
        copy.delete(trackId);
        return copy;
      });
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, isDownloaded: false } : t));
    } catch (err) {
      console.warn('Failed to delete offline track:', err);
    }
  };

  // References for event loops and timer management
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const settingsRef = useRef<SettingsState>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const stateRef = useRef({
    currentTrack,
    isPlaying,
    queue,
    queueIndex,
    repeat,
    shuffle,
    sleepTimer,
    tracks,
  });

  useEffect(() => {
    stateRef.current = {
      currentTrack,
      isPlaying,
      queue,
      queueIndex,
      repeat,
      shuffle,
      sleepTimer,
      tracks,
    };
  }, [currentTrack, isPlaying, queue, queueIndex, repeat, shuffle, sleepTimer, tracks]);

  // Load tracks from IndexedDB to restore dropped/imported files across sessions
  useEffect(() => {
    getAllStoredTracks().then((stored) => {
      if (stored && stored.length > 0) {
        // Clean up any banned/ringtone tracks from IndexedDB
        const cleanStored: Track[] = [];
        for (const t of stored) {
          if (isBannedTrack(t)) {
            deleteStoredTrack(t.id).catch(() => {});
          } else {
            cleanStored.push(t);
          }
        }

        setTracks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newStored = cleanStored.filter(s => !existingIds.has(s.id));
          if (newStored.length > 0) {
            return [...newStored, ...prev];
          }
          return prev;
        });
      }
    }).catch(err => {
      console.warn('Error loading stored tracks:', err);
    });

    // Automatically load songs from Telegram Bot Cloud on app open (no manual sync button required)
    const syncTelegramCloud = async () => {
      try {
        const cloudTracks = await telegramCloudService.autoFetchTracks();
        if (cloudTracks && cloudTracks.length > 0) {
          setTracks(prev => {
            // Keep any locally imported files
            const localTracks = prev.filter(t => t.file || !t.id.startsWith('tg-'));
            const cloudIds = new Set(cloudTracks.map(c => c.id));
            const filteredLocal = localTracks.filter(l => !cloudIds.has(l.id));
            const merged = [...cloudTracks, ...filteredLocal];
            try {
              localStorage.setItem('nova_tracks', JSON.stringify(merged.map(({ file, ...rest }) => rest)));
            } catch {}
            return merged;
          });

          // Ensure current track is refreshed with fresh coverArt, audioUrl and singer details
          setCurrentTrack(prev => {
            if (!prev) return cloudTracks[0];
            const fresh = cloudTracks.find(c => c.id === prev.id || c.title.toLowerCase().trim() === prev.title.toLowerCase().trim());
            return fresh ? { ...prev, ...fresh } : prev;
          });
        }
      } catch (err) {
        console.warn('Auto Telegram sync error:', err);
      }
    };

    // Initial sync
    syncTelegramCloud();

    // Auto-refresh when user switches back from Telegram to the app tab
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        syncTelegramCloud();
      }
    };
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    // Periodic check every 12 seconds
    const interval = setInterval(syncTelegramCloud, 12000);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      clearInterval(interval);
    };
  }, []);

  // Persist tracks
  useEffect(() => {
    try {
      // Don't persist file references (non-serializable)
      const serializableTracks = tracks.map(({ file, ...rest }) => rest);
      localStorage.setItem('nova_tracks', JSON.stringify(serializableTracks));
    } catch {
      // ignore quota
    }
  }, [tracks]);

  // Persist playlists
  useEffect(() => {
    try {
      localStorage.setItem('nova_playlists', JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('nova_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // System Playback Notification
  useEffect(() => {
    if (settings.systemNotificationsEnabled && currentTrack) {
      notificationService.showPlaybackNotification(currentTrack, isPlaying);
    }
  }, [currentTrack, isPlaying, settings.systemNotificationsEnabled]);

  // Persist & apply EQ
  useEffect(() => {
    try {
      localStorage.setItem('nova_equalizer', JSON.stringify(equalizer));
    } catch {
      // ignore
    }
    audioEngine.applyEqualizer(equalizer);
  }, [equalizer]);

  // Handle sleep timer countdown
  useEffect(() => {
    if (sleepTimer.remainingSeconds === null || sleepTimer.remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setSleepTimer(prev => {
        if (prev.remainingSeconds === null) return prev;
        if (prev.remainingSeconds <= 1) {
          if (!prev.endOfTrack) {
            audioEngine.pause();
            setIsPlaying(false);
          }
          return { minutes: null, remainingSeconds: null, endOfTrack: prev.endOfTrack };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimer.remainingSeconds, sleepTimer.endOfTrack]);

  // Setup AudioEngine callbacks and media keys
  useEffect(() => {
    audioEngine.setCallbacks(
      (time) => {
        currentTimeRef.current = time;
        setCurrentTime(time);
      },
      () => {
        handleTrackEnded();
      }
    );

    const handlePrev = () => prevTrack();
    const handleNext = () => nextTrack();
    const handlePlayState = (e: any) => {
      if (e?.detail && typeof e.detail.isPlaying === 'boolean') {
        setIsPlaying(e.detail.isPlaying);
      }
    };
    const handlePlayCmd = () => {
      audioEngine.resume();
      setIsPlaying(true);
    };
    const handlePauseCmd = () => {
      audioEngine.pause();
      setIsPlaying(false);
    };

    window.addEventListener('nova-prev-track', handlePrev);
    window.addEventListener('nova-next-track', handleNext);
    window.addEventListener('nova-play-state', handlePlayState);
    window.addEventListener('nova-play', handlePlayCmd);
    window.addEventListener('nova-pause', handlePauseCmd);

    return () => {
      window.removeEventListener('nova-prev-track', handlePrev);
      window.removeEventListener('nova-next-track', handleNext);
      window.removeEventListener('nova-play-state', handlePlayState);
      window.removeEventListener('nova-play', handlePlayCmd);
      window.removeEventListener('nova-pause', handlePauseCmd);
    };
  }, []);

  const handleTrackEnded = () => {
    const { repeat, queue, queueIndex, sleepTimer, tracks } = stateRef.current;
    const currentSettings = settingsRef.current;

    // Clear any active auto-advance timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    // Check sleep timer endOfTrack
    if (sleepTimer.endOfTrack && sleepTimer.remainingSeconds !== null && sleepTimer.remainingSeconds <= 0) {
      audioEngine.pause();
      setIsPlaying(false);
      setSleepTimer({ minutes: null, remainingSeconds: null, endOfTrack: false });
      return;
    }

    if (repeat === 'one') {
      if (stateRef.current.currentTrack) {
        audioEngine.seek(0);
        audioEngine.resume();
        setCurrentTime(0);
        setIsPlaying(true);
      }
      return;
    }

    // Determine effective queue
    let effectiveQueue = queue.length > 0 ? queue : tracks;

    // If current queue only had 1 song or is empty, seamlessly fall back to full library tracks
    if (effectiveQueue.length <= 1 && tracks.length > 1) {
      effectiveQueue = tracks;
    }

    const curId = stateRef.current.currentTrack?.id;
    const curIdx = curId ? effectiveQueue.findIndex(t => t.id === curId) : queueIndex;
    const baseIdx = curIdx !== -1 ? curIdx : queueIndex;

    let nextIdx = baseIdx + 1;

    if (stateRef.current.shuffle === 'all' && effectiveQueue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * effectiveQueue.length);
      } while (nextIdx === baseIdx && effectiveQueue.length > 1);
    } else if (nextIdx >= effectiveQueue.length) {
      // Loop back to start if repeat is 'all' or autoAdvanceLoop is enabled (default true)
      if (repeat === 'all' || currentSettings.autoAdvanceLoop !== false) {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextTr = effectiveQueue[nextIdx];
    if (!nextTr) {
      setIsPlaying(false);
      return;
    }

    const delaySecs = currentSettings.transitionDelaySecs ?? 0;
    const delayMs = Math.max(0, delaySecs * 1000);

    const executeAdvance = () => {
      setQueue(effectiveQueue);
      setQueueIndex(nextIdx);
      setCurrentTrack(nextTr);
      setDuration(nextTr.duration);
      setCurrentTime(0);
      setIsPlaying(true);
      audioEngine.playTrack(nextTr, 0, currentSettings.crossfadeSecs);
      incrementPlayCount(nextTr.id);
    };

    if (delayMs > 0) {
      // User specified a time gap before next song starts
      audioEngine.pause();
      setIsPlaying(false);
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        executeAdvance();
      }, delayMs);
    } else {
      // 0s Instant transition - plays immediately!
      executeAdvance();
    }
  };

  const incrementPlayCount = (trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return { ...t, playCount: t.playCount + 1, lastPlayed: Date.now() };
      }
      return t;
    }));

    // Update Recently Played playlist
    setPlaylists(prev => prev.map(p => {
      if (p.id === 'playlist-recent') {
        const existing = p.trackIds.filter(id => id !== trackId);
        return { ...p, trackIds: [trackId, ...existing].slice(0, 25), updatedAt: Date.now() };
      }
      return p;
    }));
  };

  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    let q = queue;
    let idx = queueIndex;

    if (newQueue) {
      q = newQueue;
      setQueue(newQueue);
      idx = newQueue.findIndex(t => t.id === track.id);
      if (idx === -1) {
        q = [track, ...newQueue];
        setQueue(q);
        idx = 0;
      }
    } else {
      idx = queue.findIndex(t => t.id === track.id);
      if (idx === -1) {
        q = [...queue, track];
        setQueue(q);
        idx = q.length - 1;
      }
    }

    setQueueIndex(idx);
    setCurrentTrack(track);
    setDuration(track.duration);
    setCurrentTime(0);
    setIsPlaying(true);

    audioEngine.playTrack(track, 0, settingsRef.current.crossfadeSecs);
    incrementPlayCount(track.id);

    // Auto-resolve synchronized lyrics if missing
    if (!track.lyrics || track.lyrics.length === 0) {
      lyricsService.getLyricsForTrack(track.title, track.artist, track.duration).then(resolvedLyrics => {
        if (resolvedLyrics && resolvedLyrics.length > 0) {
          setCurrentTrack(prev => (prev && prev.id === track.id ? { ...prev, lyrics: resolvedLyrics } : prev));
          setTracks(prevTracks => prevTracks.map(t => t.id === track.id ? { ...t, lyrics: resolvedLyrics } : t));
        }
      }).catch(() => {});
    }
  };

  const togglePlayPause = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    audioEngine.ensureAudioUnlocked();

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      if (audioEngine.isCurrentTrackLoaded()) {
        audioEngine.resume();
      } else {
        audioEngine.playTrack(currentTrack, currentTimeRef.current || 0, settingsRef.current.crossfadeSecs);
      }
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const { queue, queueIndex, shuffle, tracks, currentTrack } = stateRef.current;
    let effectiveQueue = queue.length > 0 ? queue : tracks;
    if (effectiveQueue.length <= 1 && tracks.length > 1) {
      effectiveQueue = tracks;
    }
    if (effectiveQueue.length === 0) return;

    // Find real position of current track in effectiveQueue
    const curIdx = currentTrack ? effectiveQueue.findIndex(t => t.id === currentTrack.id) : queueIndex;
    const baseIdx = curIdx !== -1 ? curIdx : queueIndex;

    let nextIdx = baseIdx + 1;
    if (shuffle === 'all' && effectiveQueue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * effectiveQueue.length);
      } while (nextIdx === baseIdx && effectiveQueue.length > 1);
    } else if (nextIdx >= effectiveQueue.length) {
      // Reached the last track: strictly wrap around to index 0 (the FIRST song)!
      nextIdx = 0;
    }

    const nextTr = effectiveQueue[nextIdx];
    if (!nextTr) return;

    setQueue(effectiveQueue);
    setQueueIndex(nextIdx);
    setCurrentTrack(nextTr);
    setDuration(nextTr.duration);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(nextTr, 0, settingsRef.current.crossfadeSecs);
    incrementPlayCount(nextTr.id);
  };

  const prevTrack = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const { queue, queueIndex, tracks, currentTrack } = stateRef.current;
    let effectiveQueue = queue.length > 0 ? queue : tracks;
    if (effectiveQueue.length <= 1 && tracks.length > 1) {
      effectiveQueue = tracks;
    }
    if (effectiveQueue.length === 0) return;

    if (currentTimeRef.current > 3) {
      audioEngine.seek(0);
      currentTimeRef.current = 0;
      setCurrentTime(0);
      return;
    }

    const curIdx = currentTrack ? effectiveQueue.findIndex(t => t.id === currentTrack.id) : queueIndex;
    const baseIdx = curIdx !== -1 ? curIdx : queueIndex;

    let prevIdx = baseIdx - 1;
    if (prevIdx < 0) {
      prevIdx = effectiveQueue.length - 1;
    }

    const prevTr = effectiveQueue[prevIdx];
    if (!prevTr) return;

    setQueue(effectiveQueue);
    setQueueIndex(prevIdx);
    setCurrentTrack(prevTr);
    setDuration(prevTr.duration);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(prevTr, 0, settingsRef.current.crossfadeSecs);
    incrementPlayCount(prevTr.id);
  };

  const seek = (seconds: number) => {
    currentTimeRef.current = seconds;
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
    }
    audioEngine.setVolume(val);
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioEngine.setMute(newMute);
  };

  const toggleFavorite = (trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const updatedFav = !t.isFavorite;
        // Also update Favourites playlist
        setPlaylists(plList => plList.map(pl => {
          if (pl.id === 'playlist-favorites') {
            const has = pl.trackIds.includes(trackId);
            const newTrackIds = updatedFav
              ? (has ? pl.trackIds : [...pl.trackIds, trackId])
              : pl.trackIds.filter(id => id !== trackId);
            return { ...pl, trackIds: newTrackIds, updatedAt: Date.now() };
          }
          return pl;
        }));
        return { ...t, isFavorite: updatedFav };
      }
      return t;
    }));

    if (currentTrack?.id === trackId) {
      setCurrentTrack(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const reorderQueue = (startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex(queueIndex - 1);
    }
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const playNext = (track: Track) => {
    setQueue(prev => {
      const newQ = [...prev];
      newQ.splice(queueIndex + 1, 0, track);
      return newQ;
    });
  };

  // Equalizer actions
  const setEQPreset = (preset: EQPreset) => {
    setEqualizer(prev => {
      const mode = prev.bandMode || '10-band';
      const presetBands = mode === '10-band' 
        ? (EQ_PRESETS_10[preset] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        : (EQ_PRESETS_5[preset] || [0, 0, 0, 0, 0]);
      return {
        ...prev,
        preset,
        bands: [...presetBands],
      };
    });
  };

  const setEQBand = (bandIndex: number, gain: number) => {
    setEqualizer(prev => {
      const newBands = [...prev.bands];
      newBands[bandIndex] = gain;
      return {
        ...prev,
        preset: 'Custom',
        bands: newBands,
      };
    });
  };

  const setEQBandMode = (bandMode: '5-band' | '10-band') => {
    setEqualizer(prev => {
      const presetBands = bandMode === '10-band'
        ? (EQ_PRESETS_10[prev.preset] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        : (EQ_PRESETS_5[prev.preset] || [0, 0, 0, 0, 0]);
      return {
        ...prev,
        bandMode,
        bands: [...presetBands],
      };
    });
  };

  const setBassBoost = (bassBoost: number) => {
    setEqualizer(prev => ({ ...prev, bassBoost }));
  };

  const setReverb = (reverb: number) => {
    setEqualizer(prev => ({ ...prev, reverb }));
  };

  const setStereoWidening = (stereoWidening: number) => {
    setEqualizer(prev => ({ ...prev, stereoWidening }));
  };

  const toggleDolbyAtmos = () => {
    setEqualizer(prev => ({ ...prev, dolbyAtmos: !prev.dolbyAtmos }));
  };

  const setDolbyProfile = (dolbyProfile: 'cinema' | 'music' | 'vocal') => {
    setEqualizer(prev => ({ ...prev, dolbyProfile }));
  };

  const setDolbyDialogueClarity = (dolbyDialogueClarity: number) => {
    setEqualizer(prev => ({ ...prev, dolbyDialogueClarity }));
  };

  const toggleEightDAudio = () => {
    setEqualizer(prev => ({ ...prev, eightDAudio: !prev.eightDAudio }));
  };

  const setEightDSpeed = (eightDSpeed: 'slow' | 'medium' | 'fast') => {
    setEqualizer(prev => ({ ...prev, eightDSpeed }));
  };

  const setEightDDistance = (eightDDistance: 'near' | 'medium' | 'far') => {
    setEqualizer(prev => ({ ...prev, eightDDistance }));
  };

  const setEightDMode = (eightDMode: 'orbit' | 'pendulum') => {
    setEqualizer(prev => ({ ...prev, eightDMode }));
  };

  const toggleEQEnabled = () => {
    setEqualizer(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // Sleep Timer
  const startSleepTimer = (minutes: number, endOfTrack: boolean = false) => {
    setSleepTimer({
      minutes,
      remainingSeconds: minutes * 60,
      endOfTrack,
    });
  };

  const cancelSleepTimer = () => {
    setSleepTimer({
      minutes: null,
      remainingSeconds: null,
      endOfTrack: false,
    });
  };

  // Tracks & Playlists
  const addTracks = (newTracks: Track[]) => {
    setTracks(prev => {
      // Update any matching existing tracks with latest audioUrl and coverArt
      const updated = prev.map(p => {
        const matching = newTracks.find(n => n.id === p.id || n.title.toLowerCase().trim() === p.title.toLowerCase().trim());
        return matching ? { ...p, ...matching } : p;
      });
      const updatedIds = new Set(updated.map(t => t.id));
      const updatedTitles = new Set(updated.map(t => t.title.toLowerCase().trim()));
      const newItems = newTracks.filter(t => !updatedIds.has(t.id) && !updatedTitles.has(t.title.toLowerCase().trim()));
      return [...updated, ...newItems];
    });
    setQueue(prev => {
      const queueIds = new Set(prev.map(t => t.id));
      const toAdd = newTracks.filter(t => !queueIds.has(t.id));
      return [...prev, ...toAdd];
    });
  };

  const deleteTrack = (trackId: string) => {
    deleteStoredTrack(trackId);
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setQueue(prev => prev.filter(t => t.id !== trackId));
    setPlaylists(prev => prev.map(p => ({
      ...p,
      trackIds: p.trackIds.filter(id => id !== trackId)
    })));
  };

  const createPlaylist = (name: string, description: string = '') => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      coverArt: 'linear-gradient(135deg, #7C6EFF 0%, #EC4899 100%)',
      trackIds: [],
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId || p.isBuiltIn));
  };

  const addTrackToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.trackIds.includes(trackId)) {
        return { ...p, trackIds: [...p.trackIds, trackId], updatedAt: Date.now() };
      }
      return p;
    }));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: Date.now() };
      }
      return p;
    }));
  };

  const reorderPlaylistTracks = (playlistId: string, startIndex: number, endIndex: number) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const copy = Array.from(p.trackIds);
        const [removed] = copy.splice(startIndex, 1);
        copy.splice(endIndex, 0, removed);
        return { ...p, trackIds: copy, updatedAt: Date.now() };
      }
      return p;
    }));
  };

  const linkAudioFileToTrack = async (trackId: string, file: File) => {
    let targetTrack: Track | undefined = tracks.find(t => t.id === trackId);
    if (!targetTrack) {
      targetTrack = DEFAULT_TRACKS.find(t => t.id === trackId);
    }
    if (!targetTrack) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const updatedTrack: Track = {
      ...targetTrack,
      file,
      format: (ext as any) || targetTrack.format,
      bitRate: `${Math.round(file.size / 1024)} KB Master File`,
    };

    // Save audio blob into IndexedDB permanently so it works across reloads
    try {
      await saveTrackWithAudio(updatedTrack, file, updatedTrack.coverArt);
    } catch (e) {
      console.warn('Failed to save track in IndexedDB:', e);
    }

    setTracks(prev => {
      const idx = prev.findIndex(t => t.id === trackId);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedTrack;
        return copy;
      }
      return [updatedTrack, ...prev];
    });

    setQueue(prev => prev.map(t => t.id === trackId ? updatedTrack : t));

    // Play user's real song immediately
    setCurrentTrack(updatedTrack);
    audioEngine.playTrack(updatedTrack);
    setIsPlaying(true);
  };

  // Settings
  const updateTheme = (theme: SettingsState['theme']) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const updateAccentColor = (accentColor: string) => {
    setSettings(prev => ({ ...prev, accentColor }));
  };

  const updateCrossfade = (crossfadeSecs: number) => {
    setSettings(prev => ({ ...prev, crossfadeSecs }));
  };

  const toggleGapless = () => {
    setSettings(prev => ({ ...prev, gapless: !prev.gapless }));
  };

  const updateSettings = (partial: Partial<SettingsState>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const clearCache = () => {
    setTracks(DEFAULT_TRACKS);
    setPlaylists(INITIAL_PLAYLISTS);
    localStorage.removeItem('nova_tracks');
    localStorage.removeItem('nova_playlists');
    clearAllAudioStorage();
  };

  const contextValue = useMemo(() => ({
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    get currentTime() {
      return currentTimeRef.current;
    },
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    queueIndex,
    equalizer,
    settings,
    sleepTimer,

    nowPlayingOpen,
    setNowPlayingOpen,
    equalizerOpen,
    setEqualizerOpen,
    queueOpen,
    setQueueOpen,
    lyricsOpen,
    setLyricsOpen,
    lockScreenOpen,
    setLockScreenOpen,
    notificationShadeOpen,
    setNotificationShadeOpen,
    sleepTimerOpen,
    setSleepTimerOpen,
    scannerOpen,
    setScannerOpen,
    playlistModalOpen,
    setPlaylistModalOpen,
    customizerOpen,
    setCustomizerOpen,
    carModeOpen,
    setCarModeOpen,

    playTrack,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleFavorite,
    setShuffle,
    setRepeat,
    reorderQueue,
    removeFromQueue,
    clearQueue,
    addToQueue,
    playNext,

    setEQPreset,
    setEQBand,
    setEQBandMode,
    setBassBoost,
    setReverb,
    setStereoWidening,
    toggleDolbyAtmos,
    setDolbyProfile,
    setDolbyDialogueClarity,
    toggleEightDAudio,
    setEightDSpeed,
    setEightDDistance,
    setEightDMode,
    toggleEQEnabled,

    startSleepTimer,
    cancelSleepTimer,

    addTracks,
    deleteTrack,
    downloadTrack,
    deleteDownloadedTrack,
    downloadedTrackIds,
    isDownloading,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    linkAudioFileToTrack,

    updateTheme,
    updateAccentColor,
    updateCrossfade,
    toggleGapless,
    clearCache,
    updateSettings,
  }), [
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    queueIndex,
    equalizer,
    settings,
    sleepTimer,
    nowPlayingOpen,
    equalizerOpen,
    queueOpen,
    lyricsOpen,
    lockScreenOpen,
    notificationShadeOpen,
    sleepTimerOpen,
    scannerOpen,
    playlistModalOpen,
    customizerOpen,
    carModeOpen,
    downloadedTrackIds,
    isDownloading,
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      <PlayerTimeContext.Provider value={currentTime}>
        {children}
      </PlayerTimeContext.Provider>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
