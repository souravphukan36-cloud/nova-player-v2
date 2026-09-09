import { Track, Playlist } from '../types';

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'tg-anuv-arz-kiya-hai',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Arz Kiya Hai - Single',
    duration: 305,
    format: 'mp3',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    audioUrl: '/api/telegram/audio?path=music/file_1.mp3',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Poetry',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 14,
    lastPlayed: Date.now() - 300000,
    isFavorite: true,
    dateAdded: 1788838410000,
    lyrics: [
      { time: 0, text: '♪ (Gentle acoustic fingerpicking & warm ambiance) ♪' },
      { time: 14, text: 'Arz kiya hai...' },
      { time: 30, text: 'Yeh dil ki baatein, yeh ansuni raatein...' },
      { time: 55, text: 'Haule se dheeme se mujhko gale laga lo na' },
      { time: 80, text: '♪ (Emotional vocal crescendo & warm harmonies) ♪' },
      { time: 115, text: 'Alvida na kehna, paas mere hi rehna...' },
      { time: 145, text: 'Khwabon ki iss dhoop mein tera saaya ban jaaun' },
      { time: 175, text: '♪ (Acoustic resonance & soulful harmonics) ♪' }
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
    audioUrl: '/api/telegram/audio?path=music/file_2.m4a',
    synthPreset: 'acoustic',
    genre: 'Hindi Indie Rock',
    folder: 'NOVA Private Library / The Local Train',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 22,
    lastPlayed: Date.now() - 600000,
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
    coverArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    audioUrl: '/api/telegram/audio?path=music/file_0.m4a',
    synthPreset: 'acoustic',
    genre: 'Hindi Indie Rock',
    folder: 'NOVA Private Library / The Local Train',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 35,
    lastPlayed: Date.now() - 120000,
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
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-favorites',
    name: 'Favourites',
    description: 'Tracks you loved with a heart',
    coverArt: 'linear-gradient(135deg, #EC4899 0%, #EF4444 100%)',
    trackIds: ['tg-anuv-arz-kiya-hai', 'tg-local-train-choo-lo', 'tg-local-train-aaoge-tum-kabhi'],
    isBuiltIn: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  },
  {
    id: 'playlist-recent',
    name: 'Recently Played',
    description: 'Your recent listening sessions',
    coverArt: 'linear-gradient(135deg, #7C6EFF 0%, #4F46E5 100%)',
    trackIds: ['tg-anuv-arz-kiya-hai', 'tg-local-train-choo-lo', 'tg-local-train-aaoge-tum-kabhi'],
    isBuiltIn: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  },
  {
    id: 'playlist-indie',
    name: 'NOVA Telegram Cloud',
    description: 'Cloud vault tracks streamed from NOVA Private Library',
    coverArt: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    trackIds: ['tg-local-train-choo-lo', 'tg-anuv-arz-kiya-hai', 'tg-local-train-aaoge-tum-kabhi'],
    isBuiltIn: true,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now()
  }
];
