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
  bands: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz (-12dB to +12dB)
  bassBoost: number; // 0 to 100
  reverb: number; // 0 to 100
  stereoWidening: number; // 0 to 100
  dolbyAtmos: boolean;
}

export type ShuffleMode = 'off' | 'all';
export type RepeatMode = 'off' | 'all' | 'one';
export type SortOption = 'title' | 'dateAdded' | 'duration' | 'artist';
export type SortDirection = 'asc' | 'desc';

export type LibrarySubTab = 'songs' | 'albums' | 'artists' | 'genres' | 'folders' | 'playlists';
export type MainTab = 'home' | 'library' | 'search' | 'settings';

export interface SettingsState {
  theme: 'amoled' | 'dark' | 'midnight' | 'slate';
  accentColor: string;
  crossfadeSecs: number;
  gapless: boolean;
  highQuality: boolean;
  supportedFormats: AudioFormat[];
  scanFolders: string[];
  autoScanOnStartup: boolean;
}
