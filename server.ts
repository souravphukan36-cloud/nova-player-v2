import express, { Request, Response } from 'express';
import path from 'path';
import https from 'https';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003542494794';

// High-speed disk cache directories (Spotify-grade edge caching)
const CACHE_DIR = path.join(process.cwd(), '.cache');
const AUDIO_CACHE_DIR = path.join(CACHE_DIR, 'audio');
const IMAGE_CACHE_DIR = path.join(CACHE_DIR, 'images');

try {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
} catch (e) {
  console.warn('Cache directory creation notice:', e);
}

function getAudioCachePath(fileId: string, filePath?: string): string {
  const hash = crypto.createHash('md5').update(fileId || filePath || 'audio').digest('hex');
  const isM4a = (filePath && (filePath.endsWith('.m4a') || filePath.includes('file_3') || filePath.includes('file_4') || filePath.includes('file_6'))) ||
                (fileId && (fileId.includes('.m4a') || fileId.includes('Aaoge') || fileId.includes('Choo') || fileId.includes('Raabta')));
  return path.join(AUDIO_CACHE_DIR, `${hash}${isM4a ? '.m4a' : '.mp3'}`);
}

function getImageCachePath(fileId: string): string {
  const hash = crypto.createHash('md5').update(fileId).digest('hex');
  return path.join(IMAGE_CACHE_DIR, `${hash}.jpg`);
}

// Preset baseline of all verified songs uploaded in the Telegram channel
const BASE_TRACKS = [
  {
    id: 'tg-anuv-arz-kiya-hai',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ',
    filePath: 'music/file_2',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Arz Kiya Hai - Single',
    duration: 305,
    format: 'mp3',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Soul',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2026,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 1,
    isFavorite: true,
    dateAdded: 1788838410000,
    lyrics: [
      { time: 0, text: '♪ (Gentle acoustic fingerpicking & warm ambiance) ♪' },
      { time: 14, text: 'Arz kiya hai...' },
      { time: 30, text: 'Yeh dil ki baatein, yeh ansuni raatein...' },
      { time: 55, text: 'Haule se dheeme se mujhko gale laga lo na' },
      { time: 80, text: '♪ (Emotional vocal crescendo & warm harmonies) ♪' },
      { time: 115, text: 'Alvida na kehna, paas mere hi rehna...' }
    ]
  },
  {
    id: 'tg-local-train-aaoge-tum-kabhi',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ',
    filePath: 'music/file_3',
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
    playCount: 1,
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
    fileId: 'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA',
    filePath: 'music/file_4',
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
    playCount: 1,
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
    fileId: 'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA',
    filePath: 'music/file_0.mp3',
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
    playCount: 1,
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
    fileId: 'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ',
    filePath: 'music/file_6.m4a',
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
    isFavorite: true,
    dateAdded: 1788947500000,
    lyrics: [
      { time: 0, text: '♪ (Lush orchestral strings and acoustic guitar intro) ♪' },
      { time: 18, text: 'Kehte hain khuda ne iss jahan mein sabhi ke liye...' },
      { time: 35, text: 'Kisi na kisi ko hai banaya har kisi ke liye...' },
      { time: 54, text: 'Tera milna hai uss rab ka ishaara maanu...' },
      { time: 72, text: 'Mujhko banaya tere jaise hi kisi ke liye...' },
      { time: 90, text: 'Kuch toh hai tujhse raabta... kuch toh hai tujhse raabta...' },
      { time: 120, text: '♪ (Arijit Singh soulful acoustic bridge) ♪' }
    ]
  },
  {
    id: 'tg-keane-somewhere-only-we-know',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA',
    filePath: 'music/file_8.mp3',
    title: 'Somewhere Only We Know',
    artist: 'Keane',
    album: 'Hopes and Fears',
    duration: 237,
    format: 'mp3',
    coverArt: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA',
    synthPreset: 'acoustic',
    genre: 'Piano Rock / Indie Pop',
    folder: 'NOVA Private Library / Keane',
    year: 2004,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 1,
    isFavorite: true,
    dateAdded: 1788950000000,
    lyrics: [
      { time: 0, text: '♪ (Distinctive driving piano chord riff) ♪' },
      { time: 14, text: 'I walked across an empty land...' },
      { time: 21, text: 'I knew the pathway like the back of my hand' },
      { time: 28, text: 'I felt the earth beneath my feet' },
      { time: 35, text: 'Sat by the river and it made me complete' },
      { time: 42, text: 'Oh simple thing, where have you gone?' },
      { time: 49, text: "I'm getting old and I need something to rely on" },
      { time: 56, text: 'So tell me when you gonna let me in' },
      { time: 63, text: "I'm getting tired and I need somewhere to begin" },
      { time: 70, text: '♪ (Soaring piano and vocal harmony crescendo) ♪' },
      { time: 84, text: 'And if you have a minute why don\'t we go...' },
      { time: 91, text: 'Talk about it somewhere only we know?' },
      { time: 98, text: 'This could be the end of everything...' },
      { time: 105, text: 'So why don\'t we go somewhere only we know?' }
    ]
  },
  {
    id: 'tg-anuv-jo-tum-mere-ho',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA',
    filePath: 'music/file_10.m4a',
    title: 'Jo Tum Mere Ho',
    artist: 'Anuv Jain',
    album: 'Jo Tum Mere Ho - Single',
    duration: 259,
    format: 'm4a',
    coverArt: '/api/telegram/image?file_id=AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA',
    synthPreset: 'acoustic',
    genre: 'Indie Acoustic / Romantic',
    folder: 'NOVA Private Library / Anuv Jain',
    year: 2024,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 1,
    isFavorite: true,
    dateAdded: 1789068141000,
    lyrics: [
      { time: 0, text: '♪ (Delicate acoustic picking & romantic guitar chords) ♪' },
      { time: 14, text: 'Jo tum mere ho, toh main kuch bhi nahi...' },
      { time: 30, text: 'Tere bina ab toh jeena nahi...' },
      { time: 48, text: 'Haule se muskura do ek dafa...' },
      { time: 65, text: '♪ (Acoustic rhythm cadence & soothing vocal melody) ♪' },
      { time: 92, text: 'Teri aankhon mein basi hai meri har subah...' },
      { time: 120, text: 'Jo tum mere ho, har gham se juda...' },
      { time: 155, text: '♪ (Emotional vocal build & gentle acoustic guitar harmonics) ♪' },
      { time: 190, text: 'Saath chalenge hum wahan, jahan aasmaan mile...' },
      { time: 225, text: 'Jo tum mere ho...' }
    ]
  }
];

// In-memory track store that can dynamically include any newly detected songs
let dynamicTracks = [...BASE_TRACKS];

// Cache resolved Telegram file_paths so we don't spam getFile API
const filePathCache: Record<string, string> = {
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'music/file_2',
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'music/file_3',
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'music/file_4',
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'music/file_0.mp3',
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'music/file_6.m4a',
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA': 'music/file_8.mp3',
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA': 'music/file_10.m4a',
  'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': 'thumbnails/file_9.jpg',
  'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': 'thumbnails/file_11.jpg'
};

// Explicit MIME type mapping for high-fidelity audio playback across Chrome/Android/iOS
const fileMimeCache: Record<string, string> = {
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'audio/mpeg', // Arz Kiya Hai (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'audio/mp4',  // Aaoge Tum Kabhi (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'audio/mp4',  // Choo Lo (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'audio/mpeg', // Kaahe Mose (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'audio/mp4',  // Raabta (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA': 'audio/mpeg', // Somewhere Only We Know (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA': 'audio/mp4',  // Jo Tum Mere Ho (.m4a)
  'music/file_2': 'audio/mpeg',
  'music/file_3': 'audio/mp4',
  'music/file_4': 'audio/mp4',
  'music/file_0.mp3': 'audio/mpeg',
  'music/file_6.m4a': 'audio/mp4',
  'music/file_8.mp3': 'audio/mpeg',
  'music/file_10.m4a': 'audio/mp4'
};

// Intelligent metadata cleaner for uploaded audio files
function cleanAudioMetadata(rawTitle: string, rawPerformer: string): { title: string; artist: string } {
  let title = rawTitle || 'Telegram Audio';
  let artist = rawPerformer || 'Indie Artist';

  const knownArtists = [
    'Anuv Jain',
    'The Local Train',
    'Keane',
    'Arijit Singh',
    'Prateek Kuhad',
    'Pritam',
    'Atif Aslam',
    'Mohit Chauhan',
    'Shreya Ghoshal',
    'Garvit Soni',
    'Priyansh Srivastava'
  ];

  for (const known of knownArtists) {
    const re = new RegExp(`\\b${known}\\b`, 'i');
    if (re.test(title) || re.test(artist)) {
      artist = known;
      title = title.replace(re, '').trim();
      break;
    }
  }

  // Remove junk like (M4A_128K), (Lyrics), [Official Audio], etc.
  title = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\b(lyrics|official audio|official video|full song|audio|hd|4k)\b/gi, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) {
    title = rawTitle.replace(/\(.*?\)/g, '').trim() || 'Telegram Audio';
  }

  return { title, artist };
}

async function resolveTelegramFilePath(fileId: string): Promise<string | null> {
  if (filePathCache[fileId]) return filePathCache[fileId];
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    if (res.ok) {
      const data = await res.json() as any;
      if (data.ok && data.result?.file_path) {
        filePathCache[fileId] = data.result.file_path;
        return data.result.file_path;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve Telegram file path for', fileId, err);
  }
  return null;
}

// Helper: Query Telegram Bot API for new updates / files
async function fetchTelegramUpdates(customToken?: string) {
  const tokenToUse = customToken || TELEGRAM_BOT_TOKEN;
  try {
    const url = `https://api.telegram.org/bot${tokenToUse}/getUpdates?allowed_updates=["channel_post","message"]&limit=100`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json() as any;
    if (data.ok && Array.isArray(data.result)) {
      for (const item of data.result) {
        const msg = item.channel_post || item.message;
        if (!msg) continue;
        const audio = msg.audio || msg.document;
        if (audio && (audio.mime_type?.startsWith('audio/') || audio.file_name?.match(/\.(mp3|flac|wav|m4a|aac|ogg)$/i))) {
          const fileId = audio.file_id;
          const fileUniqueId = audio.file_unique_id || '';
          
          // Determine correct MIME type
          let mime = audio.mime_type || 'audio/mpeg';
          if (mime === 'audio/m4a' || audio.file_name?.endsWith('.m4a') || audio.file_name?.endsWith('.mp4')) {
            mime = 'audio/mp4';
          }
          fileMimeCache[fileId] = mime;

          // Check if already in dynamicTracks
          const exists = dynamicTracks.some(t => t.fileId === fileId || (audio.title && t.title.toLowerCase() === audio.title.toLowerCase()));
          if (!exists) {
            // Retrieve file path from Telegram
            const filePath = await resolveTelegramFilePath(fileId);
            if (filePath) {
              fileMimeCache[filePath] = mime;
              const rawPerformer = audio.performer || 'Indie Artist';
              const rawTitle = audio.title || audio.file_name?.replace(/\.[^/.]+$/, '') || 'Telegram Audio';
              const { title, artist } = cleanAudioMetadata(rawTitle, rawPerformer);
              const ext = (mime === 'audio/mp4' || audio.file_name?.endsWith('.m4a')) ? 'm4a' : 'mp3';

              // Unique Track ID
              const uniqueTrackId = `tg-${fileUniqueId || 'song-' + msg.message_id || fileId.slice(-12)}`;

              // Cover art: use Telegram audio thumbnail if available, or fallback
              const thumbFileId = audio.thumbnail?.file_id || audio.thumb?.file_id;
              let coverArt = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
              if (thumbFileId) {
                coverArt = `/api/telegram/image?file_id=${thumbFileId}`;
              } else if (artist === 'Anuv Jain') {
                coverArt = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';
              }

              dynamicTracks.push({
                id: uniqueTrackId,
                fileId,
                filePath,
                title,
                artist,
                album: 'NOVA Private Library',
                duration: audio.duration || 240,
                format: ext as any,
                coverArt,
                audioUrl: `/api/telegram/audio?file_id=${fileId}`,
                synthPreset: 'acoustic',
                genre: 'Telegram Cloud Music',
                folder: `NOVA Private Library / ${artist}`,
                year: new Date().getFullYear(),
                bitRate: '320 kbps (Telegram Cloud Master)',
                playCount: 0,
                isFavorite: false,
                dateAdded: (msg.date || Math.floor(Date.now() / 1000)) * 1000,
                lyrics: [
                  { time: 0, text: `♪ Now Playing ${title} by ${artist} ♪` }
                ]
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not poll Telegram updates:', err);
  }
}

async function startServer() {
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json());

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', channelId: TELEGRAM_CHANNEL_ID, trackCount: dynamicTracks.length });
  });

  // 1. Get all tracks from Telegram bot channel
  app.get('/api/telegram/tracks', async (req: Request, res: Response) => {
    // Check for any new updates in background
    await fetchTelegramUpdates();
    res.json({
      success: true,
      channel: 'NOVA Private Library',
      tracks: dynamicTracks,
    });
  });

  // Manual or automatic sync trigger
  app.post('/api/telegram/sync', async (req: Request, res: Response) => {
    const customToken = req.body?.botToken || req.query.bot_token as string;
    await fetchTelegramUpdates(customToken);
    res.json({
      success: true,
      count: dynamicTracks.length,
      tracks: dynamicTracks,
    });
  });

  // 2. High-speed Audio Stream Proxy with Spotify-grade Disk Caching & Range support
  app.all('/api/telegram/audio', async (req: Request, res: Response) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.sendStatus(200);
      return;
    }

    let filePath = req.query.path as string;
    const fileId = req.query.file_id as string;

    // If only file_id is provided, resolve file path first
    if (!filePath && fileId) {
      filePath = (await resolveTelegramFilePath(fileId)) || '';
    }

    if (!filePath && !fileId) {
      res.status(400).send('Missing filePath or fileId');
      return;
    }

    // Determine content-type based on explicit fileMimeCache, then filename/extension
    let contentType = (fileId && fileMimeCache[fileId]) || (filePath && fileMimeCache[filePath]);
    if (!contentType) {
      const ext = filePath ? filePath.split('.').pop()?.toLowerCase() : '';
      if (ext === 'm4a' || ext === 'mp4' || ext === 'aac' || (filePath && (filePath.includes('file_3') || filePath.includes('file_4') || filePath.includes('file_6')))) {
        contentType = 'audio/mp4';
      } else if (ext === 'flac') {
        contentType = 'audio/flac';
      } else if (ext === 'wav') {
        contentType = 'audio/wav';
      } else if (ext === 'ogg') {
        contentType = 'audio/ogg';
      } else {
        contentType = 'audio/mpeg';
      }
    }

    // 1. Check local disk cache (instant playback, 0 network latency, Spotify-grade speed)
    const cachedFilePath = getAudioCachePath(fileId || filePath, filePath);

    if (fs.existsSync(cachedFilePath)) {
      try {
        const stat = fs.statSync(cachedFilePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('X-Cache-Status', 'HIT-DISK');

        if (req.method === 'HEAD') {
          res.setHeader('Content-Length', fileSize);
          res.status(200).end();
          return;
        }

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = (end - start) + 1;

          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
          res.setHeader('Content-Length', chunkSize);

          const stream = fs.createReadStream(cachedFilePath, { start, end });
          stream.pipe(res);
          return;
        } else {
          res.status(200);
          res.setHeader('Content-Length', fileSize);
          const stream = fs.createReadStream(cachedFilePath);
          stream.pipe(res);
          return;
        }
      } catch (err) {
        console.warn('Error reading from disk cache, falling back to Telegram proxy:', err);
      }
    }

    // 2. Cache Miss: Stream from Telegram and write to local disk cache simultaneously
    const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    https.get(telegramFileUrl, { headers }, (tgRes) => {
      const statusCode = tgRes.statusCode || 200;

      res.status(statusCode);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('X-Cache-Status', 'MISS-STREAMING');

      if (tgRes.headers['content-range']) {
        res.setHeader('Content-Range', tgRes.headers['content-range']);
      }
      if (tgRes.headers['content-length']) {
        res.setHeader('Content-Length', tgRes.headers['content-length']);
      }

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      // If full audio stream (status 200), save to disk cache in background
      if (statusCode === 200) {
        const tempPath = `${cachedFilePath}.tmp.${Date.now()}`;
        const writeStream = fs.createWriteStream(tempPath);
        tgRes.pipe(writeStream);
        writeStream.on('finish', () => {
          fs.rename(tempPath, cachedFilePath, (err) => {
            if (!err) {
              console.log(`[Spotify Cache Engine] Saved to disk cache: ${path.basename(cachedFilePath)}`);
            }
          });
        });
        writeStream.on('error', () => {
          try { fs.unlinkSync(tempPath); } catch {}
        });
      }

      tgRes.pipe(res);
    }).on('error', (err) => {
      console.error('Telegram streaming proxy error:', err);
      if (!res.headersSent) {
        res.status(502).send('Error streaming audio from Telegram');
      }
    });
  });

  // In-memory cache for fetched Telegram images to make album artwork load instantly
  const imageMemoryCache: Map<string, { buffer: Buffer; mimeType: string }> = new Map();

  // 3. Image Proxy for Telegram Track Thumbnails / Album Covers (Memory + Disk Cached)
  app.get('/api/telegram/image', async (req: Request, res: Response) => {
    const fileId = req.query.file_id as string;
    if (!fileId) {
      res.status(400).send('Missing file_id');
      return;
    }

    // Check fast in-memory cache
    if (imageMemoryCache.has(fileId)) {
      const cached = imageMemoryCache.get(fileId)!;
      res.setHeader('Content-Type', cached.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(cached.buffer);
      return;
    }

    // Check disk cache
    const diskImagePath = getImageCachePath(fileId);
    if (fs.existsSync(diskImagePath)) {
      try {
        const buffer = fs.readFileSync(diskImagePath);
        const mimeType = 'image/jpeg';
        imageMemoryCache.set(fileId, { buffer, mimeType });
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(buffer);
        return;
      } catch {}
    }

    try {
      const filePath = await resolveTelegramFilePath(fileId);
      if (!filePath) {
        res.status(404).send('Image file not found on Telegram');
        return;
      }

      const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
      https.get(telegramFileUrl, (tgRes) => {
        if (tgRes.statusCode !== 200) {
          res.status(tgRes.statusCode || 404).send('Image not available');
          return;
        }

        let mimeType = 'image/jpeg';
        const lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (lowerPath.endsWith('.webp')) {
          mimeType = 'image/webp';
        } else if (lowerPath.endsWith('.gif')) {
          mimeType = 'image/gif';
        } else {
          mimeType = 'image/jpeg';
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

        const chunks: Buffer[] = [];
        tgRes.on('data', (c) => chunks.push(c));
        tgRes.on('end', () => {
          const buffer = Buffer.concat(chunks);
          imageMemoryCache.set(fileId, { buffer, mimeType });
          try {
            fs.writeFileSync(diskImagePath, buffer);
          } catch {}
          res.send(buffer);
        });
      }).on('error', (err) => {
        console.error('Telegram image proxy error:', err);
        if (!res.headersSent) {
          res.status(502).send('Error fetching image');
        }
      });
    } catch (err) {
      console.error('Telegram image route exception:', err);
      if (!res.headersSent) {
        res.status(500).send('Image proxy error');
      }
    }
  });

  // Vite middleware setup (development vs production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Spotify-grade background pre-caching: downloads and warms all channel audio to local SSD
  async function preCacheAllTracks() {
    for (const track of dynamicTracks) {
      try {
        const cachedAudio = getAudioCachePath(track.fileId, track.filePath);
        if (!fs.existsSync(cachedAudio)) {
          let filePath = track.filePath;
          if (!filePath && track.fileId) {
            filePath = await resolveTelegramFilePath(track.fileId) || '';
          }
          if (filePath) {
            const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
            const tempPath = `${cachedAudio}.tmp.${Date.now()}`;
            await new Promise<void>((resolve) => {
              https.get(telegramFileUrl, (tgRes) => {
                if (tgRes.statusCode === 200) {
                  const ws = fs.createWriteStream(tempPath);
                  tgRes.pipe(ws);
                  ws.on('finish', () => {
                    fs.rename(tempPath, cachedAudio, () => {
                      console.log(`[Spotify Pre-Cache] Pre-cached to disk: "${track.title}" by ${track.artist}`);
                      resolve();
                    });
                  });
                  ws.on('error', () => {
                    try { fs.unlinkSync(tempPath); } catch {}
                    resolve();
                  });
                } else {
                  resolve();
                }
              }).on('error', () => resolve());
            });
          }
        }
      } catch {
        // quiet fallback
      }
    }
  }

  // Start background periodic polling for Telegram bot updates (every 10s)
  setInterval(() => {
    fetchTelegramUpdates().then(() => preCacheAllTracks()).catch(() => {});
  }, 10000);
  fetchTelegramUpdates().then(() => preCacheAllTracks()).catch(() => {});

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA Player server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
