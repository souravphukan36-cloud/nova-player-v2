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
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ',
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
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ',
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
    coverArt: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA',
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
    year: 2025,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 5,
    lastPlayed: Date.now() - 60000,
    isFavorite: true,
    dateAdded: 1788943704000,
    lyrics: [
      { time: 0, text: '♪ Kaahe Mose - Garvit Soni, Priyansh Srivastava ♪' },
      { time: 15, text: 'Kaahe mose naina milaye re...' },
      { time: 45, text: 'Palchhin tore sang laage jiya...' },
      { time: 75, text: '♪ (Soulful Indian Classical Fusion) ♪' }
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
    playCount: 1,
    lastPlayed: Date.now(),
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
