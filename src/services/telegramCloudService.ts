import { Track, TelegramChannelConfig } from '../types';
import { saveTrackWithAudio } from './storageDb';

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

// Exactly the 3 songs uploaded to the Telegram bot channel
export const INITIAL_CLOUD_TRACKS: Track[] = [
  {
    id: 'tg-anuv-arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Arz Kiya Hai - Single',
    duration: 305,
    format: 'mp3',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Poetry',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 14,
    isFavorite: true,
    dateAdded: 1788838410000,
    lyrics: [
      { time: 0, text: '♪ (Gentle acoustic fingerpicking & warm ambiance) ♪' },
      { time: 14, text: 'Arz kiya hai...' },
      { time: 30, text: 'Yeh dil ki baatein, yeh ansuni raatein...' },
      { time: 55, text: 'Haule se dheeme se mujhko gale laga lo na' },
      { time: 80, text: '♪ (Emotional vocal crescendo & warm harmonies) ♪' },
      { time: 115, text: 'Alvida na kehna, paas mere hi rehna...' },
      { time: 145, text: 'Khwabon ki iss dhoop mein tera saaya ban jaaun' }
    ]
  },
  {
    id: 'tg-local-train-aaoge-tum-kabhi',
    title: 'Aaoge Tum Kabhi',
    artist: 'The Local Train',
    album: 'Aalas Ka Pedh',
    duration: 264,
    format: 'm4a',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ',
    synthPreset: 'acoustic',
    genre: 'Hindi Indie Rock',
    folder: 'NOVA Private Library / The Local Train',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 22,
    isFavorite: true,
    dateAdded: 1788838410000,
    lyrics: [
      { time: 0, text: '♪ (Driving indie drum cadence & melodic electric guitar) ♪' },
      { time: 16, text: 'Aaoge tum kabhi, meri jaan keh rahi...' },
      { time: 32, text: 'Guzregi yeh raat bhi, subah nayi aayegi...' },
      { time: 52, text: '♪ (Rock chorus opens with soaring vocal resonance) ♪' },
      { time: 70, text: 'Saansein yeh rukti nahi, yaadein yeh mitti nahi...' },
      { time: 95, text: 'Khwaab jo dekhe the humne saath mil kar' },
      { time: 120, text: '♪ (Blistering guitar solo & thumping rhythm section) ♪' },
      { time: 160, text: 'Aaoge tum kabhi... laut ke yahin...' }
    ]
  },
  {
    id: 'tg-local-train-choo-lo',
    title: 'Choo Lo',
    artist: 'The Local Train',
    album: 'Aalas Ka Pedh',
    duration: 233,
    format: 'm4a',
    coverArt: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA',
    synthPreset: 'acoustic',
    genre: 'Hindi Indie Rock',
    folder: 'NOVA Private Library / The Local Train',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 35,
    isFavorite: true,
    dateAdded: 1788886613000,
    lyrics: [
      { time: 0, text: '♪ (Signature indie rock guitar arpeggio prelude) ♪' },
      { time: 14, text: 'Khada hoon aaj bhi wahin, ke dil phir beqarar hai...' },
      { time: 28, text: 'Kaisi hai yeh berukhi, na jaane kaisa pyaar hai...' },
      { time: 42, text: '♪ (Bass and drums drop with intense energy) ♪' },
      { time: 50, text: 'Choo lo jo mujhe tum kabhi, kho na jaaun main raat-din...' },
      { time: 68, text: 'Nazron mein tum ho basey, keh do na yeh sach hai...' },
      { time: 88, text: 'Jaane kyu yeh dooriyan badh gayi hain darmiyaan' },
      { time: 104, text: '♪ (Raman Negi vocal power & soaring rock guitar riff) ♪' },
      { time: 135, text: 'Choo lo jo mujhe tum kabhi... kho na jaaun main...' }
    ]
  },
  {
    id: 'tg-garvit-kaahe-mose',
    title: 'Kaahe Mose',
    artist: 'Garvit Soni, Priyansh Srivastava',
    album: 'SambalpuriStar.In - Kaahe Mose',
    duration: 219,
    format: 'mp3',
    coverArt: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA',
    synthPreset: 'acoustic',
    genre: 'Hindi Soul / Indie',
    folder: 'NOVA Private Library / Garvit Soni, Priyansh Srivastava',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 15,
    isFavorite: true,
    dateAdded: 1788943704000,
    lyrics: [
      { time: 0, text: '♪ (Soulful Indian Contemporary Prelude) ♪' },
      { time: 15, text: 'Kaahe mose naina milaye re...' },
      { time: 45, text: 'Palchhin tore sang laage jiya...' },
      { time: 75, text: '♪ (Soulful Indian Classical & Contemporary Fusion) ♪' }
    ]
  },
  {
    id: 'tg-pritam-raabta',
    title: 'Raabta (Kehte Hain Khuda Ne)',
    artist: 'Pritam, Shreya Ghoshal, Arijit Singh',
    album: 'Agent Vinod',
    duration: 290,
    format: 'm4a',
    coverArt: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ',
    synthPreset: 'acoustic',
    genre: 'Romantic / Hindi Soul',
    folder: 'NOVA Private Library / Pritam, Shreya Ghoshal, Arijit Singh',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 20,
    isFavorite: true,
    dateAdded: 1788954302000,
    lyrics: [
      { time: 0, text: '♪ (Kehte hain khuda ne iss jahan mein sabhi ke liye) ♪' },
      { time: 15, text: 'Kehte hain khuda ne iss jahan mein sabhi ke liye...' },
      { time: 32, text: 'Kisi na kisi ko hai banaya har kisi ke liye...' },
      { time: 48, text: 'Tera milna hai uss rab ka ishaara maanu...' },
      { time: 68, text: 'Kuch toh hai tujhse raabta, kuch toh hai tujhse raabta...' },
      { time: 95, text: 'Kaise hum jaane hume kya pata, kuch toh hai tujhse raabta...' },
      { time: 120, text: '♪ (Soulful vocal harmonies by Arijit Singh & Shreya Ghoshal) ♪' },
      { time: 150, text: 'Meherbani jaate jaate mujhpe kar gaya...' }
    ]
  }
];

export const ARTIST_PROFILES: Record<string, { photoUrl: string; bio: string }> = {
  'Anuv Jain': {
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    bio: 'Soulful indie acoustic singer-songwriter known for Arz Kiya Hai, Baarishein, and lyrical storytelling.'
  },
  'The Local Train': {
    photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    bio: 'Iconic Indian rock band renowned for Choo Lo, Aaoge Tum Kabhi, and energetic live soundscapes.'
  },
  'Garvit Soni, Priyansh Srivastava': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E',
    bio: 'Soulful contemporary Hindi indie music and expressive classical fusion melodies.'
  },
  'Pritam, Shreya Ghoshal, Arijit Singh': {
    photoUrl: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA',
    bio: 'Timeless romantic melodies and chart-topping Bollywood masterpieces featuring soulful vocal power.'
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
  public getSingerWiseShelves(searchQuery?: string, selectedSinger?: string): CloudArtistShelf[] {
    let filtered = this.cloudTracks;

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
      const res = await fetch('/api/telegram/tracks');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          this.cloudTracks = data.tracks;
          try {
            localStorage.setItem(STORAGE_KEY_CLOUD_TRACKS, JSON.stringify(data.tracks));
          } catch {}
          return data.tracks;
        }
      }
    } catch (e) {
      console.warn('Auto fetch from /api/telegram/tracks failed, using fallback:', e);
    }
    return this.cloudTracks;
  }

  // Save a cloud song directly to local IndexedDB for offline playback
  public async saveTrackToOffline(track: Track): Promise<boolean> {
    try {
      let audioBlob: Blob;
      if (track.audioUrl) {
        const resp = await fetch(track.audioUrl);
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
