import { Track, TelegramChannelConfig } from '../types';
import { saveTrackWithAudio } from './storageDb';
import { getApiBaseUrl, resolveAudioStreamUrl } from './apiConfig';
import { DEFAULT_TRACKS } from '../data/defaultTracks';

const STORAGE_KEY_CONFIG = 'nova_telegram_channel_config';
const STORAGE_KEY_CLOUD_TRACKS = 'nova_cloud_channel_tracks_v2';

export interface CloudArtistShelf {
  artist: string;
  photoUrl: string;
  bio: string;
  tracks: Track[];
  songCount: number;
  totalDuration: number;
}

// Master cloud tracks initialized directly from DEFAULT_TRACKS so all 17 songs are always included
export const INITIAL_CLOUD_TRACKS: Track[] = DEFAULT_TRACKS;

export const ARTIST_PROFILES: Record<string, { photoUrl: string; bio: string }> = {
  'Mohit Chauhan, A.R. Rahman': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E',
    bio: 'Renowned Indian singer celebrated for soulful ballads, timeless Bollywood classics, and Silk Route classics.'
  },
  'Mohit Chauhan': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E',
    bio: 'Renowned Indian singer celebrated for soulful ballads, timeless Bollywood classics, and Silk Route classics.'
  },
  'Arijit Singh': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E',
    bio: 'India\'s most beloved playback singer and musical maestro known for heartfelt romantic ballads and legendary soulful vocals.'
  },
  'Arijit Singh, Mithoon': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E',
    bio: 'India\'s most beloved playback singer and musical maestro known for heartfelt romantic ballads and legendary soulful vocals.'
  },
  'Anuv Jain': {
    photoUrl: '/covers/anuv-jain-artist.jpg',
    bio: 'Soulful indie acoustic singer-songwriter known for Arz Kiya Hai, Jo Tum Mere Ho, Baarishein, and lyrical storytelling.'
  },
  'The Local Train': {
    photoUrl: '/covers/the-local-train-artist.jpg',
    bio: 'Iconic Indian rock band renowned for Choo Lo, Aaoge Tum Kabhi, and energetic live soundscapes.'
  },
  'Garvit Soni, Priyansh Srivastava': {
    photoUrl: '/covers/kaahe-mose.jpg',
    bio: 'Soulful contemporary Hindi indie music and expressive classical fusion melodies.'
  },
  'Pritam, Shreya Ghoshal, Arijit Singh': {
    photoUrl: '/covers/raabta.jpg',
    bio: 'Timeless romantic melodies and chart-topping Bollywood masterpieces featuring soulful vocal power.'
  },
  'Keane': {
    photoUrl: '/covers/somewhere-only-we-know.jpg',
    bio: 'Legendary English alternative rock band known for piano-driven anthems like Somewhere Only We Know and Everybody\'s Changing.'
  },
  'Vishal Mishra, Manoj Muntashir': {
    photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    bio: 'Soul-stirring Indian composer and vocalist celebrated for heartfelt cinematic masterpieces like Kaise Hua.'
  },
  'Rahat Fateh Ali Khan, Sunidhi Chauhan, Sajid-Wajid': {
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    bio: 'Legendary Sufi master paired with Bollywood powerhouse vocals in the iconic romantic anthem Surili Akhiyon Wale.'
  },
  'Banjaare': {
    photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    bio: 'Raw, emotive indie acoustic collective known for heartfelt folklore and soul-captivating acoustic rhythm.'
  },
  'Kaavish, Quratulain Balouch': {
    photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    bio: 'Critically acclaimed Pakistani classical-contemporary ensemble behind the timeless Coke Studio ballad Faasle.'
  },
  'Redbone': {
    photoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    bio: 'Iconic 1970s Native American funk-rock legends celebrated worldwide for Come And Get Your Love.'
  },
  'Maan Panu': {
    photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
    bio: 'Atmospheric Punjabi indie artist blending melancholic acoustic melodies with raw, evocative poetry.'
  },
  'Radiohead': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E',
    bio: 'Legendary British alternative rock innovators renowned worldwide for The Bends and OK Computer.'
  },
  'Danyal Zafar, Momina Mustehsan': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E',
    bio: 'Coke Studio sensation bringing intricate guitar fingerpicking and ethereal vocal duets in the hit song Muntazir.'
  }
};

class TelegramCloudService {
  private config: TelegramChannelConfig = {
    botToken: '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg',
    channelId: '-1003542494794',
    channelTitle: 'NOVA Private Library',
    isConfigured: true,
    lastSyncTime: Date.now(),
  };

  private cloudTracks: Track[] = [];

  constructor() {
    this.loadSavedConfig();
    this.loadSavedTracks();

    if (typeof window !== 'undefined') {
      // Auto-poll telegram tracks every 6 seconds in background
      setTimeout(() => {
        this.autoFetchTracks().catch(() => {});
      }, 1000);

      setInterval(() => {
        this.autoFetchTracks().catch(() => {});
      }, 6000);

      window.addEventListener('focus', () => {
        this.autoFetchTracks().catch(() => {});
      });
    }
  }

  private loadSavedConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
  }

  private loadSavedTracks() {
    try {
      localStorage.removeItem('nova_cloud_channel_tracks');
      const saved = localStorage.getItem(STORAGE_KEY_CLOUD_TRACKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Always refresh with authoritative INITIAL_CLOUD_TRACKS so stale/broken cached audio URLs or cover arts get repaired immediately
          const initialMap = new Map(INITIAL_CLOUD_TRACKS.map(t => [t.id, t]));
          const updated = parsed.map((t: Track) => {
            const fresh = initialMap.get(t.id);
            if (fresh) {
              return {
                ...t,
                ...fresh,
                playCount: t.playCount ?? fresh.playCount,
                isFavorite: t.isFavorite ?? fresh.isFavorite
              };
            }
            return t;
          });
          const existingIds = new Set(updated.map((t: Track) => t.id));
          const newFromInitial = INITIAL_CLOUD_TRACKS.filter(t => !existingIds.has(t.id));
          this.cloudTracks = [...updated, ...newFromInitial];
          try {
            localStorage.setItem(STORAGE_KEY_CLOUD_TRACKS, JSON.stringify(this.cloudTracks));
          } catch {}
          return;
        }
      }
    } catch {
      // fallback
    }
    this.cloudTracks = [...INITIAL_CLOUD_TRACKS];
  }

  public getConfig(): TelegramChannelConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<TelegramChannelConfig>): TelegramChannelConfig {
    this.config = { ...this.config, ...newConfig, isConfigured: true };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch {
      // ignore
    }
    return this.config;
  }

  public getCloudTracks(): Track[] {
    return [...this.cloudTracks];
  }

  // Get singer-wise grouped shelves (Anuv Jain, The Local Train)
  public getSingerWiseShelves(searchQuery?: string, selectedSinger?: string, sourceTracks?: Track[]): CloudArtistShelf[] {
    let filtered = (sourceTracks && sourceTracks.length > 0)
      ? sourceTracks.filter(t => t.id.startsWith('tg-') || t.audioUrl?.includes('/telegram/'))
      : this.cloudTracks;

    if (filtered.length === 0) {
      filtered = this.cloudTracks;
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    }

    if (selectedSinger && selectedSinger !== 'All') {
      filtered = filtered.filter(t => t.artist.toLowerCase() === selectedSinger.toLowerCase());
    }

    // Group by artist
    const groups: Record<string, Track[]> = {};
    for (const track of filtered) {
      const artist = track.artist || 'Indie Artist';
      if (!groups[artist]) {
        groups[artist] = [];
      }
      groups[artist].push(track);
    }

    // Convert to structured shelves
    return Object.entries(groups).map(([artist, tracks]) => {
      const profile = ARTIST_PROFILES[artist] || {
        photoUrl: tracks[0]?.coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        bio: `${artist} collection in NOVA Private Library.`
      };

      const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);

      return {
        artist,
        photoUrl: profile.photoUrl,
        bio: profile.bio,
        tracks,
        songCount: tracks.length,
        totalDuration
      };
    });
  }

  // Automatic silent sync with Telegram Bot on app open
  public async autoFetchTracks(): Promise<Track[]> {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/telegram/tracks`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          const countChanged = this.cloudTracks.length !== data.tracks.length;
          this.cloudTracks = data.tracks;
          try {
            localStorage.setItem(STORAGE_KEY_CLOUD_TRACKS, JSON.stringify(data.tracks));
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nova-cloud-tracks-updated', { detail: data.tracks }));
          }
          return data.tracks;
        }
      }
    } catch (e) {
      console.warn('Auto fetch from /api/telegram/tracks failed, using direct Telegram sync:', e);
    }

    // Direct Telegram fallback when running in APK or standalone offline clone
    try {
      const token = this.config.botToken || '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?allowed_updates=["channel_post","message"]&limit=100`);
      if (tgRes.ok) {
        const tgData = await tgRes.json();
        if (tgData.ok && Array.isArray(tgData.result)) {
          const newTracks: Track[] = [];
          for (const item of tgData.result) {
            const msg = item.channel_post || item.message;
            if (!msg) continue;
            const audio = msg.audio || msg.document;
            if (audio && (audio.mime_type?.startsWith('audio/') || audio.file_name?.match(/\.(mp3|flac|wav|m4a|aac|ogg)$/i))) {
              const fileId = audio.file_id;
              const fileUniqueId = audio.file_unique_id || '';
              const exists = this.cloudTracks.some(t => t.audioUrl?.includes(fileId) || (audio.title && t.title.toLowerCase() === audio.title.toLowerCase()));
              if (!exists) {
                const rawTitle = audio.title || audio.file_name?.replace(/\.[^/.]+$/, '') || 'Telegram Track';
                const rawArtist = audio.performer || 'Indie Artist';
                const thumbFileId = audio.thumbnail?.file_id || audio.thumb?.file_id;
                const coverArt = thumbFileId
                  ? `/api/telegram/image?file_id=${thumbFileId}`
                  : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';

                const track: Track = {
                  id: `tg-${fileUniqueId || 'song-' + (msg.message_id || Date.now())}`,
                  title: rawTitle,
                  artist: rawArtist,
                  album: 'NOVA Private Library',
                  duration: audio.duration || 240,
                  format: (audio.file_name?.endsWith('.m4a') || audio.mime_type === 'audio/mp4') ? 'm4a' : 'mp3',
                  coverArt,
                  audioUrl: `/api/telegram/audio?file_id=${fileId}`,
                  synthPreset: 'acoustic',
                  genre: 'Telegram Cloud Music',
                  folder: `NOVA Private Library / ${rawArtist}`,
                  year: new Date().getFullYear(),
                  bitRate: '320 kbps (Telegram Cloud Master)',
                  playCount: 0,
                  isFavorite: false,
                  dateAdded: (msg.date || Math.floor(Date.now() / 1000)) * 1000,
                  lyrics: [
                    { time: 0, text: `♪ ${rawTitle} - ${rawArtist} ♪` }
                  ]
                };
                newTracks.push(track);
              }
            }
          }
          if (newTracks.length > 0) {
            this.cloudTracks = [...this.cloudTracks, ...newTracks];
            try {
              localStorage.setItem(STORAGE_KEY_CLOUD_TRACKS, JSON.stringify(this.cloudTracks));
            } catch {}
          }
        }
      }
    } catch (tgErr) {
      console.warn('Direct Telegram updates fetch failed:', tgErr);
    }

    return this.cloudTracks;
  }

  // Save a cloud song directly to local IndexedDB for offline playback
  public async saveTrackToOffline(track: Track): Promise<boolean> {
    try {
      let audioBlob: Blob;
      if (track.audioUrl) {
        const fullUrl = resolveAudioStreamUrl(track.audioUrl);
        const resp = await fetch(fullUrl);
        audioBlob = await resp.blob();
      } else {
        audioBlob = new Blob([new Uint8Array(1024)], { type: 'audio/mpeg' });
      }

      await saveTrackWithAudio({
        ...track,
        folder: '/Storage/Music/NOVA-Cloud-Offline'
      }, audioBlob, track.coverArt);

      return true;
    } catch (e) {
      console.warn('Failed to cache track offline:', e);
      return false;
    }
  }
}

export const telegramCloudService = new TelegramCloudService();
