export type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg' | 'm4a';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  format: AudioFormat;
  coverArt: string; // URL or CSS gradient or data URI
  file?: File;
  synthPreset?: string; // For built-in high quality procedural synthesis
  audioUrl?: string;
  lyrics?: LyricLine[];
  folder: string;
  genre: string;
  year?: number;
  bitRate?: string;
  playCount: number;
  lastPlayed?: number; // timestamp
  isFavorite: boolean;
  isDownloaded?: boolean;
  dateAdded: number; // timestamp
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverArt: string;
  trackIds: string[];
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type EQPreset = 
  | 'Normal' 
  | 'Bass Boost' 
  | 'Rock' 
  | 'Pop' 
  | 'Jazz' 
  | 'Classical' 
  | 'EDM' 
  | 'Vocal' 
  | 'Custom';

export interface EqualizerState {
  enabled: boolean;
  preset: EQPreset;
  bands: number[]; // 5 or 10 band gains (-12dB to +12dB)
  bandMode: '5-band' | '10-band';
  bassBoost: number; // 0 to 100
  reverb: number; // 0 to 100
  stereoWidening: number; // 0 to 100
  dolbyAtmos: boolean;
  eightDAudio: boolean; // Dynamic 8D spatial binaural audio effect
}

export type ShuffleMode = 'off' | 'all';
export type RepeatMode = 'off' | 'all' | 'one';
export type SortOption = 'title' | 'dateAdded' | 'duration' | 'artist';
export type SortDirection = 'asc' | 'desc';

export type LibrarySubTab = 'songs' | 'albums' | 'artists' | 'genres' | 'folders' | 'playlists' | 'downloaded';
export type MainTab = 'home' | 'library' | 'cloud' | 'search' | 'settings';

export interface TelegramChannelConfig {
  botToken: string;
  channelId: string;
  channelTitle: string;
  isConfigured: boolean;
  lastSyncTime?: number;
}

export interface SettingsState {
  theme: 'amoled' | 'dark' | 'midnight' | 'slate';
  accentColor: string;
  crossfadeSecs: number;
  gapless: boolean;
  highQuality: boolean;
  supportedFormats: AudioFormat[];
  scanFolders: string[];
  autoScanOnStartup: boolean;
  // User Customizations
  soundAliveSpectrum: boolean; // Sound live spectrum toggle (default: false)
  showTopStatusBar: boolean; // Show top status bar toggle
  topBarRedAccent: boolean; // Show Lock, Time, EQ, Panel in sleek red word style
  homeShowResumeCard: boolean; // Home screen hero card
  homeShowRecent: boolean; // Home screen recently played
  homeShowMostPlayed: boolean; // Home screen most played
  libraryDefaultSubTab: LibrarySubTab; // Default library sub-tab
  libraryViewMode: 'list' | 'grid'; // Grid vs List for albums & artists
  libraryShowCharacterGrid: boolean; // Show Music Character/Mood shelf in library
  searchInstantFilter: boolean; // Instant live search
  searchShowUnheardShelf: boolean; // Show never-heard-before tracks shelf in search
  systemNotificationsEnabled: boolean; // System Notification & media session
  transitionDelaySecs: number; // Delay between songs in seconds (0 = instant, 0.5s, 1s, 2s, 3s, etc.)
  autoAdvanceLoop: boolean; // Loop back to start when queue finishes so playback never stops

  // BitChord-Inspired & Customizable Shelves
  homeShelves: {
    showRecentlyPlayed: boolean;
    showQuickPicks: boolean;
    showMoodTherapy: boolean;
    showArtistSpotlight: boolean;
    showAlbumsSingles: boolean;
    showAllTracks: boolean;
    cardStyle: 'portrait' | 'square' | 'compact';
  };
  nowPlayingConfig: {
    layoutStyle: 'immersive-backdrop' | 'curved-card' | 'vinyl-disc';
    showLyricsLine: boolean;
    showVolumeBar: boolean;
    infiniteAutoplay: boolean;
  };
}
