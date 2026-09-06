import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import { getAllStoredTracks, deleteStoredTrack, clearAllAudioStorage } from '../services/storageDb';
import { notificationService } from '../services/notificationService';

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
  setBassBoost: (val: number) => void;
  setReverb: (val: number) => void;
  setStereoWidening: (val: number) => void;
  toggleDolbyAtmos: () => void;
  toggleEQEnabled: () => void;

  // Sleep Timer
  startSleepTimer: (minutes: number, endOfTrack?: boolean) => void;
  cancelSleepTimer: () => void;

  // Playlists & Tracks
  addTracks: (newTracks: Track[]) => void;
  deleteTrack: (trackId: string) => void;
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, startIndex: number, endIndex: number) => void;

  // Settings
  updateTheme: (theme: SettingsState['theme']) => void;
  updateAccentColor: (color: string) => void;
  updateCrossfade: (secs: number) => void;
  toggleGapless: () => void;
  clearCache: () => void;
  updateSettings: (partial: Partial<SettingsState>) => void;
}

const EQ_PRESETS: Record<EQPreset, [number, number, number, number, number]> = {
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

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'amoled',
  accentColor: '#7C6EFF',
  crossfadeSecs: 2,
  gapless: true,
  highQuality: true,
  supportedFormats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  scanFolders: ['/Storage/emulated/0/Music', '/Storage/emulated/0/Download'],
  autoScanOnStartup: true,
  soundAliveSpectrum: false, // Turned OFF by default as requested
  showTopStatusBar: true,
  topBarRedAccent: true,
  homeShowResumeCard: true,
  homeShowRecent: true,
  homeShowMostPlayed: true,
  libraryDefaultSubTab: 'songs',
  libraryViewMode: 'list',
  searchInstantFilter: true,
  systemNotificationsEnabled: true,
};

const DEFAULT_EQ: EqualizerState = {
  enabled: true,
  preset: 'Bass Boost',
  bands: [6, 4, 1, 0, 0],
  bassBoost: 60,
  reverb: 20,
  stereoWidening: 45,
  dolbyAtmos: true,
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Saved state from localStorage
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('nova_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [equalizer, setEqualizer] = useState<EqualizerState>(() => {
    try {
      const saved = localStorage.getItem('nova_equalizer');
      if (saved) return { ...DEFAULT_EQ, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_EQ;
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEFAULT_TRACKS[0].duration);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [shuffle, setShuffle] = useState<ShuffleMode>('off');
  const [repeat, setRepeat] = useState<RepeatMode>('off');

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

  // References for event loops
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
        setTracks(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newStored = stored.filter(s => !existingIds.has(s.id));
          if (newStored.length > 0) {
            return [...newStored, ...prev];
          }
          return prev;
        });
      }
    }).catch(err => {
      console.warn('Error loading stored tracks:', err);
    });
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
        setCurrentTime(time);
      },
      () => {
        handleTrackEnded();
      }
    );

    const handlePrev = () => prevTrack();
    const handleNext = () => nextTrack();

    window.addEventListener('nova-prev-track', handlePrev);
    window.addEventListener('nova-next-track', handleNext);

    return () => {
      window.removeEventListener('nova-prev-track', handlePrev);
      window.removeEventListener('nova-next-track', handleNext);
    };
  }, []);

  const handleTrackEnded = () => {
    const { repeat, queue, queueIndex, sleepTimer } = stateRef.current;

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

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      const nextTr = queue[nextIdx];
      setQueueIndex(nextIdx);
      setCurrentTrack(nextTr);
      setDuration(nextTr.duration);
      setCurrentTime(0);
      audioEngine.playTrack(nextTr, 0, settings.crossfadeSecs);
      setIsPlaying(true);
      incrementPlayCount(nextTr.id);
    } else if (repeat === 'all' && queue.length > 0) {
      const firstTr = queue[0];
      setQueueIndex(0);
      setCurrentTrack(firstTr);
      setDuration(firstTr.duration);
      setCurrentTime(0);
      audioEngine.playTrack(firstTr, 0, settings.crossfadeSecs);
      setIsPlaying(true);
      incrementPlayCount(firstTr.id);
    } else {
      setIsPlaying(false);
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

    audioEngine.playTrack(track, 0, settings.crossfadeSecs);
    incrementPlayCount(track.id);
  };

  const togglePlayPause = () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    const { queue, queueIndex, shuffle, repeat } = stateRef.current;
    if (queue.length === 0) return;

    let nextIdx = queueIndex + 1;
    if (shuffle === 'all' && queue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIndex && queue.length > 1);
    } else if (nextIdx >= queue.length) {
      if (repeat === 'all') {
        nextIdx = 0;
      } else {
        return;
      }
    }

    const nextTr = queue[nextIdx];
    setQueueIndex(nextIdx);
    setCurrentTrack(nextTr);
    setDuration(nextTr.duration);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(nextTr, 0, settings.crossfadeSecs);
    incrementPlayCount(nextTr.id);
  };

  const prevTrack = () => {
    const { queue, queueIndex } = stateRef.current;
    if (queue.length === 0) return;

    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }

    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = queue.length - 1;
    }

    const prevTr = queue[prevIdx];
    setQueueIndex(prevIdx);
    setCurrentTrack(prevTr);
    setDuration(prevTr.duration);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(prevTr, 0, settings.crossfadeSecs);
    incrementPlayCount(prevTr.id);
  };

  const seek = (seconds: number) => {
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
    const presetBands = EQ_PRESETS[preset] || [0, 0, 0, 0, 0];
    setEqualizer(prev => ({
      ...prev,
      preset,
      bands: [...presetBands] as [number, number, number, number, number],
    }));
  };

  const setEQBand = (bandIndex: number, gain: number) => {
    setEqualizer(prev => {
      const newBands = [...prev.bands] as [number, number, number, number, number];
      newBands[bandIndex] = gain;
      return {
        ...prev,
        preset: 'Custom',
        bands: newBands,
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
      const existingIds = new Set(prev.map(t => t.id));
      const filtered = newTracks.filter(t => !existingIds.has(t.id));
      return [...prev, ...filtered];
    });
    setQueue(prev => [...prev, ...newTracks]);
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

  return (
    <PlayerContext.Provider
      value={{
        tracks,
        playlists,
        currentTrack,
        isPlaying,
        currentTime,
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
        setBassBoost,
        setReverb,
        setStereoWidening,
        toggleDolbyAtmos,
        toggleEQEnabled,

        startSleepTimer,
        cancelSleepTimer,

        addTracks,
        deleteTrack,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,

        updateTheme,
        updateAccentColor,
        updateCrossfade,
        toggleGapless,
        clearCache,
        updateSettings,
      }}
    >
      {children}
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
