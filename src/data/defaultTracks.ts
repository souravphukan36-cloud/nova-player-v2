import { Track, Playlist } from '../types';

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'tg-tu-kya-jaane',
    title: 'Tu Kya Jaane',
    artist: 'A.R. Rahman',
    album: 'Amar Singh Chamkila',
    duration: 256,
    format: 'm4a',
    coverArt: '/covers/tu-kya-jaane.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMyasNw2ap2pCDvj0WOGP6JCEejbyUAAj4iAAK0qxlWSRS-TFeoNAABPQQ',
    synthPreset: 'acoustic',
    genre: 'Soulful / Bollywood Classical',
    folder: 'NOVA Private Library / A.R. Rahman',
    year: 2024,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 18,
    isFavorite: true,
    dateAdded: 1791193305000,
    lyrics: [
      { time: 0, text: '♪ (Lush acoustic melody & soul-stirring ambience) ♪' },
      { time: 15, text: 'Tu kya jaane mere dil ka haal...' },
      { time: 45, text: 'Kyun rota hai yeh har ek raat...' },
      { time: 75, text: '♪ (Emotional vocal crescendo & warm harmonies) ♪' },
      { time: 115, text: 'Tu kya jaane...' }
    ]
  },
  {
    id: 'tg-tu-bata',
    title: 'Tu Bata',
    artist: 'AFTAB',
    album: 'Tu Bata - Single',
    duration: 160,
    format: 'm4a',
    coverArt: '/covers/tu-bata.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMzasNw2pOyU3eFxQ-wlp_yn5WSerAAAj8iAAK0qxlWlKzlnht75E89BA',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Pop',
    folder: 'NOVA Private Library / AFTAB',
    year: 2024,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 12,
    isFavorite: true,
    dateAdded: 1791193307000,
    lyrics: [
      { time: 0, text: '♪ (Gentle guitar chords & warm vocals) ♪' },
      { time: 10, text: 'Tu bata, kya tera bhi dil dukhta hai...' },
      { time: 40, text: 'Kyun yeh raaste juda hone lage...' },
      { time: 75, text: '♪ (Soothing indie acoustic melody) ♪' }
    ]
  },
  {
    id: 'tg-husn',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: 'Husn - Single',
    duration: 217,
    format: 'm4a',
    coverArt: '/covers/husn.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM0asNw3FaNcLEMXiRz2jCZsAwxSBkAAkAiAAK0qxlWWMXTt8DSghU9BA',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Poetry',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2023,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 45,
    isFavorite: true,
    dateAdded: 1791193310000,
    lyrics: [
      { time: 0, text: '♪ (Acoustic fingerpicking & soulful piano) ♪' },
      { time: 12, text: 'Dekho deewane aaye hain...' },
      { time: 30, text: 'Husn tera taareefein kare...' },
      { time: 60, text: 'Par hum toh bas teri aankhon mein doobe...' },
      { time: 100, text: '♪ (Emotional vocal resonance) ♪' }
    ]
  },
  {
    id: 'tg-inaam',
    title: 'Inaam',
    artist: 'Anuv Jain',
    album: 'Inaam - Single',
    duration: 257,
    format: 'm4a',
    coverArt: '/covers/inaam.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM1asNw3s2xnNSZ6KEgSHuZfNXGHngAAkEiAAK0qxlW8Z7k1pxqPaY9BA',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Melancholy',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2024,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 22,
    isFavorite: true,
    dateAdded: 1791193313000,
    lyrics: [
      { time: 0, text: '♪ (Gentle acoustic resonance & storytelling) ♪' },
      { time: 15, text: 'Inaam mein mila yeh dard tera...' },
      { time: 45, text: 'Kyun har khwaab adhura sa reh gaya...' },
      { time: 80, text: '♪ (Soulful crescendo & acoustic warmth) ♪' }
    ]
  },
  {
    id: 'tg-gul',
    title: 'Gul',
    artist: 'Anuv Jain',
    album: 'Gul - Single',
    duration: 217,
    format: 'm4a',
    coverArt: '/covers/gul.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM2asNw4YImA0zJyyYPVuzET0x2XIgAAkIiAAK0qxlWrj48NKkXEGk9BA',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Poetry',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2021,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 38,
    isFavorite: true,
    dateAdded: 1791193315000,
    lyrics: [
      { time: 0, text: '♪ (Uplifting acoustic guitar & melodic whistling) ♪' },
      { time: 14, text: 'Gulshan mein gul khile hain jaise...' },
      { time: 38, text: 'Teri muskaan se mehek uthe hain raste...' },
      { time: 70, text: '♪ (Acoustic warmth & fingerstyle guitar) ♪' }
    ]
  },
  {
    id: 'tg-baarishein',
    title: 'Baarishein',
    artist: 'Anuv Jain',
    album: 'Baarishein - Single',
    duration: 207,
    format: 'm4a',
    coverArt: '/covers/baarishein.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM3asNw46C2FQob9hh8VqYTIsIdSqgAAkMiAAK0qxlWhnKNwKOUyK89BA',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Poetry',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2018,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 52,
    isFavorite: true,
    dateAdded: 1791193318000,
    lyrics: [
      { time: 0, text: '♪ (Gentle acoustic strumming & rain ambience) ♪' },
      { time: 10, text: 'Hawaayein le rahi hain karwatein...' },
      { time: 30, text: 'Yeh baarishein keh rahi hain daastan...' },
      { time: 60, text: 'Tujhse judi har baat yaad aane lagi...' },
      { time: 95, text: '♪ (Acoustic rain harmonics) ♪' }
    ]
  },
  {
    id: 'tg-baarishein-acoustic',
    title: 'Baarishein (Acoustic)',
    artist: 'Anuv Jain',
    album: 'Baarishein (Live Acoustic Session)',
    duration: 209,
    format: 'm4a',
    coverArt: '/covers/baarishein-acoustic.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM4asNw5xeRgLkdnN0pXv3cYO9JrnoAAkQiAAK0qxlW0W_Z7WyW9Uk9BA',
    synthPreset: 'acoustic',
    genre: 'Raw Acoustic / Studio Session',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2022,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 29,
    isFavorite: false,
    dateAdded: 1791193321000,
    lyrics: [
      { time: 0, text: '♪ (Raw acoustic fingerpicking & studio warmth) ♪' },
      { time: 15, text: 'Kyun yeh baarishein mujhko rulaayein...' },
      { time: 50, text: 'Tere bina yeh raatein soni si hain...' }
    ]
  },
  {
    id: 'tg-antariksh',
    title: 'Antariksh',
    artist: 'Anuv Jain',
    album: 'Antariksh - Single',
    duration: 165,
    format: 'm4a',
    coverArt: '/covers/antariksh.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAM5asNw6c_ljG-53WqTvhxi2b-IXAYAAkUiAAK0qxlWcdlsg5ib5mQ9BA',
    synthPreset: 'acoustic',
    genre: 'Indie Space Acoustic / Poetry',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2023,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 19,
    isFavorite: true,
    dateAdded: 1791193324000,
    lyrics: [
      { time: 0, text: '♪ (Dreamy acoustic guitar harmonics & stellar warmth) ♪' },
      { time: 12, text: 'Antariksh ke taaron mein dhoonda tujhe...' },
      { time: 35, text: 'Kahin door ek roshni si jali...' },
      { time: 70, text: '♪ (Atmospheric guitar space reverb) ♪' }
    ]
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-favorites',
    name: 'Starred Vault',
    description: 'Your favorite master recordings',
    coverArt: 'linear-gradient(135deg, #FF6E7F 0%, #BFE9FF 100%)',
    trackIds: [
      'tg-tu-kya-jaane',
      'tg-husn',
      'tg-baarishein',
      'tg-gul'
    ],
    isBuiltIn: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  },
  {
    id: 'playlist-recent',
    name: 'Recently Played',
    description: 'Your recent listening sessions',
    coverArt: 'linear-gradient(135deg, #7C6EFF 0%, #4F46E5 100%)',
    trackIds: [
      'tg-tu-kya-jaane',
      'tg-tu-bata',
      'tg-husn',
      'tg-inaam',
      'tg-gul',
      'tg-baarishein'
    ],
    isBuiltIn: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now()
  },
  {
    id: 'playlist-indie',
    name: 'NOVA Telegram Cloud',
    description: 'Verified live cloud vault streamed directly from Telegram',
    coverArt: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    trackIds: [
      'tg-tu-kya-jaane',
      'tg-tu-bata',
      'tg-husn',
      'tg-inaam',
      'tg-gul',
      'tg-baarishein',
      'tg-baarishein-acoustic',
      'tg-antariksh'
    ],
    isBuiltIn: true,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now()
  }
];
