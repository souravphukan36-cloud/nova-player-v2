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
const UPLOADS_DIR = path.join(process.cwd(), '.cache', 'uploads');

try {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.warn('Cache directory creation notice:', e);
}

function detectAudioContentType(filePath: string): string {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    // Check for ID3 or MP3 sync word
    if (buf.subarray(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
      return 'audio/mpeg';
    }
    // Check for MP4 / M4A (ftyp box at offset 4)
    if (buf.subarray(4, 8).toString() === 'ftyp') {
      return 'audio/mp4';
    }
  } catch {}
  return filePath.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4';
}

function findAudioCacheFile(fileId?: string, filePath?: string): { path: string; contentType: string } | null {
  const ids: string[] = [];
  if (fileId) ids.push(fileId);
  if (filePath) ids.push(filePath);

  for (const id of ids) {
    const hash = crypto.createHash('md5').update(id).digest('hex');
    const m4aPath = path.join(AUDIO_CACHE_DIR, `${hash}.m4a`);
    const mp3Path = path.join(AUDIO_CACHE_DIR, `${hash}.mp3`);
    if (fs.existsSync(m4aPath)) {
      return { path: m4aPath, contentType: detectAudioContentType(m4aPath) };
    }
    if (fs.existsSync(mp3Path)) {
      return { path: mp3Path, contentType: detectAudioContentType(mp3Path) };
    }
  }
  return null;
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
    coverArt: '/covers/arz-kiya-hai.jpg',
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
    coverArt: '/covers/aaoge-tum-kabhi.jpg',
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
    coverArt: '/covers/choo-lo.jpg',
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
    coverArt: '/covers/kaahe-mose.jpg',
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
    coverArt: '/covers/raabta.jpg',
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
    coverArt: '/covers/somewhere-only-we-know.jpg',
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
    coverArt: '/covers/jo-tum-mere-ho.jpg',
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
  },
  {
    id: 'tg-arijit-dil-jhoom',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA',
    filePath: 'music/file_27.m4a',
    title: 'Dil Jhoom',
    artist: 'Arijit Singh, Mithoon',
    album: 'Gadar 2',
    duration: 304,
    format: 'm4a',
    coverArt: '/covers/dil-jhoom.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA',
    synthPreset: 'acoustic',
    genre: 'Romantic / Hindi Soul',
    folder: 'NOVA Private Library / Arijit Singh',
    year: 2023,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 18,
    isFavorite: true,
    dateAdded: 1789218954000,
    lyrics: [
      { time: 0, text: '♪ (Acoustic guitar and soulful strings intro) ♪' },
      { time: 14, text: 'Main jhoom jhoom jhoom jhoom taan...' },
      { time: 32, text: 'Dil jhoom jhoom jhoom jhoom taan...' },
      { time: 50, text: 'Tere ishq mein yeh dil jhoom jhoom taan...' },
      { time: 75, text: '♪ (Arijit Singh soulful romantic melody) ♪' },
      { time: 105, text: 'Tu hi mera armaan hai, tu hi mera sahara...' },
      { time: 140, text: 'Tere bina ab jeena nahi gavara...' },
      { time: 175, text: '♪ (Lush orchestral crescendo & chorus) ♪' },
      { time: 210, text: 'Dil jhoom jhoom jhoom jhoom taan...' }
    ]
  },
  {
    id: 'tg-nadaan-parinde',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ',
    filePath: 'music/file_29.m4a',
    title: 'Nadaan Parinde',
    artist: 'Mohit Chauhan, A.R. Rahman',
    album: 'Rockstar',
    duration: 384,
    format: 'm4a',
    coverArt: '/covers/nadaan-parinde.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ',
    synthPreset: 'acoustic',
    genre: 'Sufi Rock / Bollywood',
    folder: 'NOVA Private Library / Mohit Chauhan',
    year: 2011,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 12,
    isFavorite: true,
    dateAdded: 1789222257000,
    lyrics: [
      { time: 0, text: '♪ (Distorted guitar rift and heavy rock drums prelude) ♪' },
      { time: 20, text: 'O naadan parindey ghar aaja...' },
      { time: 42, text: 'Ghar aaja, ghar aaja, ghar aaja...' },
      { time: 65, text: 'Kyun des bides firaaey tu?' },
      { time: 90, text: 'Kyun ulti reet chalaaey tu?' },
      { time: 120, text: '♪ (Rock crescendo & electric guitar solo) ♪' },
      { time: 160, text: 'Kaaga re kaaga mori itni araj tose...' },
      { time: 185, text: 'Chun chun khaaiyo maans...' },
      { time: 210, text: 'Khaiyo na do naina mori...' },
      { time: 240, text: 'Piya ke milan ki aas...' }
    ]
  },
  {
    id: 'tg-AgADFSEAAuafMVU',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E',
    filePath: 'music/file_33.m4a',
    title: 'Kaise Hua',
    artist: 'Vishal Mishra, Manoj Muntashir',
    album: 'Kabir Singh',
    duration: 234,
    format: 'm4a',
    coverArt: '/covers/kaise-hua.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E',
    synthPreset: 'acoustic',
    genre: 'Bollywood / Romantic Melodic',
    folder: 'NOVA Private Library / Vishal Mishra',
    year: 2019,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 5,
    isFavorite: true,
    dateAdded: 1789280000000,
    lyrics: [
      { time: 0, text: '♪ (Acoustic guitar melody & soft pads) ♪' },
      { time: 15, text: 'Hansta rehta hoon tujhse milkar kyu aajkal...' },
      { time: 35, text: 'Badle badle hain mere tevar kyu aajkal...' },
      { time: 55, text: 'Aankhein meri har jagah dhoondhe tujhe bewajah...' },
      { time: 75, text: 'Ye main hoon ya koi aur hai meri tarah...' },
      { time: 95, text: 'Kaise hua, kaise hua, tu itna zaroori kaise hua...' },
      { time: 120, text: '♪ (Acoustic guitar crescendo & strings swell) ♪' },
      { time: 150, text: 'Baatein dilon ki khud-ba-khud hone lagi...' },
      { time: 180, text: 'Kaise hua, kaise hua, tu itna zaroori kaise hua...' }
    ]
  },
  {
    id: 'tg-sajid-wajid-surili-akhiyon-wale',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA',
    filePath: 'music/file_14.m4a',
    title: 'Surili Akhiyon Wale',
    artist: 'Rahat Fateh Ali Khan, Sunidhi Chauhan, Sajid-Wajid',
    album: 'Veer',
    duration: 331,
    format: 'm4a',
    coverArt: '/covers/surili-akhiyon-wale.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA',
    synthPreset: 'acoustic',
    genre: 'Bollywood / Classical Romance',
    folder: 'NOVA Private Library / Rahat Fateh Ali Khan',
    year: 2010,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 16,
    isFavorite: true,
    dateAdded: 1789100000000,
    lyrics: [
      { time: 0, text: '♪ (Haunting acoustic sarangi & acoustic rhythm intro) ♪' },
      { time: 18, text: 'Surili akhiyon wale, suna hai teri akhiyon se...' },
      { time: 45, text: 'Behti hai neendein aur neendon mein sapne...' },
      { time: 75, text: 'Kabhi toh kinaare pe, laa do hamare...' },
      { time: 105, text: '♪ (Rahat Fateh Ali Khan soulful vocal improvisation) ♪' },
      { time: 140, text: 'Tere bina jeena lage adhura...' },
      { time: 180, text: 'Surili akhiyon wale...' }
    ]
  },
  {
    id: 'tg-banjaare-bairan',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA',
    filePath: 'music/file_17.mp3',
    title: 'Bairan',
    artist: 'Banjaare',
    album: 'Bairan - Single',
    duration: 151,
    format: 'mp3',
    coverArt: '/covers/bairan.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA',
    synthPreset: 'acoustic',
    genre: 'Indie Folk / Acoustic',
    folder: 'NOVA Private Library / Banjaare',
    year: 2024,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 19,
    isFavorite: true,
    dateAdded: 1789120000000,
    lyrics: [
      { time: 0, text: '♪ (Earthy acoustic guitar strumming & folk flute) ♪' },
      { time: 15, text: 'Bairan hawaayein chhoo ke jo guzrein...' },
      { time: 35, text: 'Yaadein purani dhoondhein rastey...' },
      { time: 60, text: 'Kaisi yeh baatein, kaisi yeh yaadein...' },
      { time: 90, text: '♪ (Uplifting acoustic folk percussion & harmonies) ♪' },
      { time: 120, text: 'Bairan bani yeh ratiyaan saari...' }
    ]
  },
  {
    id: 'tg-kaavish-faasle',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA',
    filePath: 'music/file_19.m4a',
    title: 'Faasle',
    artist: 'Kaavish, Quratulain Balouch',
    album: 'Coke Studio Season 10',
    duration: 311,
    format: 'm4a',
    coverArt: '/covers/faasle.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA',
    synthPreset: 'acoustic',
    genre: 'Sufi / Semi-Classical',
    folder: 'NOVA Private Library / Kaavish',
    year: 2017,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 28,
    isFavorite: true,
    dateAdded: 1789150000000,
    lyrics: [
      { time: 0, text: '♪ (Gentle grand piano chord progression & warm cello) ♪' },
      { time: 20, text: 'Faasle na rahein darmiyaan...' },
      { time: 45, text: 'Kyun khoye se hain do jahaan...' },
      { time: 75, text: '♪ (Quratulain Balouch soulful harmony entry) ♪' },
      { time: 110, text: 'Tere bina ab saans na aaye...' },
      { time: 150, text: 'Laut ke aaja, man behel jaaye...' },
      { time: 195, text: '♪ (Stirring piano & acoustic vocal climax) ♪' },
      { time: 240, text: 'Faasle mitt gaye...' }
    ]
  },
  {
    id: 'tg-redbone-come-and-get-your-love',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA',
    filePath: 'music/file_22.mp3',
    title: 'Come And Get Your Love',
    artist: 'Redbone',
    album: 'Wovoka',
    duration: 208,
    format: 'mp3',
    coverArt: '/covers/come-and-get-your-love.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA',
    synthPreset: 'acoustic',
    genre: 'Funk Rock / 70s Classic',
    folder: 'NOVA Private Library / Redbone',
    year: 1974,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 42,
    isFavorite: true,
    dateAdded: 1789180000000,
    lyrics: [
      { time: 0, text: "♪ (Hey! (Hey) What's the matter with your head, yeah) ♪" },
      { time: 14, text: 'Come and get your love, come and get your love...' },
      { time: 28, text: 'Come and get your love, come and get your love now!' },
      { time: 45, text: '♪ (Iconic groovy bass riff & punchy drums) ♪' },
      { time: 65, text: 'With a girl like you, with a girl like you...' },
      { time: 90, text: "There is nothin' to say, go on and move on..." },
      { time: 120, text: 'Come and get your love!' }
    ]
  },
  {
    id: 'tg-maan-panu-last-letter',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA',
    filePath: 'music/file_24.mp3',
    title: 'The Last Letter',
    artist: 'Maan Panu',
    album: 'The Last Letter - Single',
    duration: 169,
    format: 'mp3',
    coverArt: '/covers/the-last-letter.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA',
    synthPreset: 'acoustic',
    genre: 'Punjabi Lo-fi / Melancholy',
    folder: 'NOVA Private Library / Maan Panu',
    year: 2023,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 11,
    lastPlayed: Date.now() - 360000,
    isFavorite: false,
    dateAdded: 1789200000000,
    lyrics: [
      { time: 0, text: '♪ (Mellow lo-fi keys & vinyl crackle ambience) ♪' },
      { time: 16, text: 'Aakhri khat tera padh ke ve sajna...' },
      { time: 36, text: 'Akhiyan cho athru dul gaye...' },
      { time: 60, text: 'Kitiyan si jo gallan pyaar diyan...' },
      { time: 85, text: 'Pal vich saariyan bhul gaye...' },
      { time: 115, text: '♪ (Atmospheric guitar line & deep bass groove) ♪' },
      { time: 140, text: 'The last letter left on my desk...' }
    ]
  },
  {
    id: 'tg-radiohead-black-star',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA',
    filePath: 'music/file_35.mp3',
    title: 'Black Star',
    artist: 'Radiohead',
    album: 'The Bends',
    duration: 247,
    format: 'mp3',
    coverArt: '/covers/black-star.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA',
    synthPreset: 'acoustic',
    genre: 'Alternative Rock / 90s Grunge',
    folder: 'NOVA Private Library / Radiohead',
    year: 1995,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 31,
    lastPlayed: Date.now() - 500000,
    isFavorite: true,
    dateAdded: 1789300000000,
    lyrics: [
      { time: 0, text: "♪ (Tremolo guitar intro building into the famous riff) ♪" },
      { time: 16, text: "I get home from work and you're still in bed..." },
      { time: 32, text: 'I feel a bit sad so I lean down and kiss your head...' },
      { time: 50, text: 'What are we coming to? What are we gonna do?' },
      { time: 70, text: 'Blame it on the black star...' },
      { time: 90, text: 'Blame it on the falling sky...' },
      { time: 110, text: '♪ (Thom Yorke soaring falsetto and crescendo) ♪' },
      { time: 140, text: 'Blame it on the satellite that beams me home...' }
    ]
  },
  {
    id: 'tg-AgADXiEAAk4ySFU',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA',
    filePath: 'music/file_65.m4a',
    title: 'Muntazir',
    artist: 'Danyal Zafar, Momina Mustehsan',
    album: 'Coke Studio Season 10',
    duration: 337,
    format: 'm4a',
    coverArt: '/covers/muntazir.jpg',
    audioUrl: '/api/telegram/audio?file_id=CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA',
    synthPreset: 'acoustic',
    genre: 'Pop / Coke Studio',
    folder: 'NOVA Private Library / Danyal Zafar, Momina Mustehsan',
    year: 2017,
    bitRate: '320 kbps (Telegram Cloud Master)',
    playCount: 18,
    lastPlayed: Date.now() - 400000,
    isFavorite: true,
    dateAdded: 1789411140000,
    lyrics: [
      { time: 0, text: '♪ (Acoustic guitar strums and strings intro) ♪' },
      { time: 20, text: 'Jaise baarish ki boondein...' },
      { time: 42, text: 'Girti hain zameen par...' },
      { time: 65, text: 'Tera intezaar karta raha dil mera...' },
      { time: 90, text: '♪ (Momina & Danyal harmonic duet) ♪' },
      { time: 130, text: 'Tu jo mila toh mili yeh zindagi...' },
      { time: 165, text: 'Tu na mila toh kuch bhi nahi...' }
    ]
  }
];

// In-memory track store that can dynamically include any newly detected songs
let dynamicTracks: any[] = [...BASE_TRACKS];
let lastTelegramUpdateId = 0;

const TRACKS_DB_PATH = path.join(CACHE_DIR, 'tracks_db.json');
const TRACKS_METADATA_PATH = path.join(CACHE_DIR, 'tracks_metadata.json');

// Interface for custom track overrides (Step 1 Foundation)
export interface TrackOverride {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  coverArt?: string;
  lyrics?: Array<{ time: number; text: string }>;
  isFavorite?: boolean;
  isHidden?: boolean;
  isFeatured?: boolean;
  synthPreset?: string;
  updatedAt?: number;
}

// In-memory store for track overrides: trackId -> TrackOverride
let trackOverrides: Record<string, TrackOverride> = {};

// Load persisted track overrides
function loadTrackOverrides() {
  try {
    if (fs.existsSync(TRACKS_METADATA_PATH)) {
      const raw = fs.readFileSync(TRACKS_METADATA_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        trackOverrides = data;
        console.log(`[Metadata Engine] Loaded ${Object.keys(trackOverrides).length} custom track overrides`);
      }
    }
  } catch (e) {
    console.warn('[Metadata Engine] Could not load tracks_metadata.json:', e);
  }
}

// Save track overrides to disk
function saveTrackOverrides() {
  try {
    fs.writeFileSync(TRACKS_METADATA_PATH, JSON.stringify(trackOverrides, null, 2), 'utf-8');
    console.log(`[Metadata Engine] Saved ${Object.keys(trackOverrides).length} custom track overrides to disk`);
  } catch (e) {
    console.warn('[Metadata Engine] Could not save tracks_metadata.json:', e);
  }
}

// Helper: Apply metadata overrides onto any track object
function applyTrackOverrides(track: any): any {
  if (!track || !track.id) return track;
  const override = trackOverrides[track.id];
  if (!override) return track;

  return {
    ...track,
    title: override.title !== undefined && override.title.trim() !== '' ? override.title.trim() : track.title,
    artist: override.artist !== undefined && override.artist.trim() !== '' ? override.artist.trim() : track.artist,
    album: override.album !== undefined && override.album.trim() !== '' ? override.album.trim() : track.album,
    genre: override.genre !== undefined && override.genre.trim() !== '' ? override.genre.trim() : track.genre,
    year: override.year !== undefined ? override.year : track.year,
    coverArt: override.coverArt !== undefined && override.coverArt.trim() !== '' ? override.coverArt.trim() : track.coverArt,
    lyrics: override.lyrics !== undefined && Array.isArray(override.lyrics) && override.lyrics.length > 0 ? override.lyrics : track.lyrics,
    isFavorite: override.isFavorite !== undefined ? override.isFavorite : track.isFavorite,
    isHidden: override.isHidden !== undefined ? override.isHidden : false,
    isFeatured: override.isFeatured !== undefined ? override.isFeatured : false,
    synthPreset: override.synthPreset !== undefined ? override.synthPreset : track.synthPreset,
    hasCustomMetadata: true,
    lastMetadataUpdated: override.updatedAt || undefined,
  };
}

// Load metadata overrides right away
loadTrackOverrides();

// Load persisted tracks and offset on startup
try {
  if (fs.existsSync(TRACKS_DB_PATH)) {
    const dbData = JSON.parse(fs.readFileSync(TRACKS_DB_PATH, 'utf-8'));
    if (Array.isArray(dbData.tracks)) {
      // Merge with BASE_TRACKS to ensure base tracks are always present
      const existingIds = new Set(BASE_TRACKS.map(t => t.id));
      const newTracks = dbData.tracks.filter((t: any) => !existingIds.has(t.id));
      dynamicTracks = [...BASE_TRACKS, ...newTracks];
    }
    if (dbData.lastUpdateId) {
      lastTelegramUpdateId = dbData.lastUpdateId;
    }
  }
} catch (e) {
  console.warn('Could not load tracks DB:', e);
}

function saveTracksDb() {
  try {
    fs.writeFileSync(TRACKS_DB_PATH, JSON.stringify({
      lastUpdateId: lastTelegramUpdateId,
      tracks: dynamicTracks
    }, null, 2));
  } catch (e) {
    console.warn('Could not save tracks DB:', e);
  }
}

// Cache resolved Telegram file_paths so we don't spam getFile API
const filePathCache: Record<string, string> = {
  // Verified Telegram Cloud Audio File Paths (Current Active CDN Mapping)
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'music/file_146',    // Arz Kiya Hai (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'music/file_151',    // Aaoge Tum Kabhi (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'music/file_150',    // Choo Lo (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'music/file_152',    // Kaahe Mose (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'music/file_153',    // Raabta (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA': 'music/file_155',    // Somewhere Only We Know (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA': 'music/file_154',    // Jo Tum Mere Ho (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA': 'music/file_156',    // Dil Jhoom (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ': 'music/file_157',    // Nadaan Parinde (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E': 'music/file_158',    // Kaash Aisa Hota (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA': 'music/file_159',    // Surili Akhiyon Wale (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA': 'music/file_160',    // Bairan (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA': 'music/file_161',    // Faasle (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA': 'music/file_149',    // Kaise Hua (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA': 'music/file_148',    // Come And Get Your Love (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA': 'music/file_162',    // Black Star (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA': 'music/file_147',    // Muntazir (.m4a)

  // Real Uploaded Song Picture / Thumbnails
  'AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E': 'thumbnails/file_87.jpg',
  'AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E': 'thumbnails/file_93.jpg',
  'AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA': 'thumbnails/file_88.jpg',
  'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': 'thumbnails/file_91.jpg',
  'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': 'thumbnails/file_92.jpg',
  'AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E': 'thumbnails/file_90.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E': 'thumbnails/file_89.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA': 'thumbnails/file_89.jpg',
  'AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E': 'thumbnails/file_96.jpg',
  'AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E': 'thumbnails/file_97.jpg',
  'AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E': 'thumbnails/file_94.jpg',
  'AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E': 'thumbnails/file_98.jpg',
  'AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E': 'thumbnails/file_95.jpg',
  'AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E': 'thumbnails/file_100.jpg',
  'AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E': 'thumbnails/file_99.jpg'
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
  'CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA': 'audio/mp4',  // Dil Jhoom (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ': 'audio/mp4',  // Nadaan Parinde (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E': 'audio/mp4',  // Kaash Aisa Hota (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA': 'audio/mp4',  // Surili Akhiyon Wale (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA': 'audio/mpeg', // Bairan (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA': 'audio/mp4',  // Faasle (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA': 'audio/mpeg', // Kaise Hua (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA': 'audio/mpeg', // Come And Get Your Love (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA': 'audio/mpeg', // Black Star (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA': 'audio/mp4',  // Muntazir (.m4a)
  'music/file_70': 'audio/mpeg',
  'music/file_71': 'audio/mp4',
  'music/file_72.m4a': 'audio/mp4',
  'music/file_73.mp3': 'audio/mpeg',
  'music/file_74.m4a': 'audio/mp4',
  'music/file_75.mp3': 'audio/mpeg',
  'music/file_76.m4a': 'audio/mp4',
  'music/file_77.m4a': 'audio/mp4',
  'music/file_78.m4a': 'audio/mp4',
  'music/file_79.m4a': 'audio/mp4',
  'music/file_80.m4a': 'audio/mp4',
  'music/file_81.mp3': 'audio/mpeg',
  'music/file_82.m4a': 'audio/mp4',
  'music/file_83.mp3': 'audio/mpeg',
  'music/file_84.mp3': 'audio/mpeg',
  'music/file_85.mp3': 'audio/mpeg',
  'music/file_86.m4a': 'audio/mp4'
};

// Intelligent metadata cleaner for uploaded audio files: respects existing title and performer!
function cleanAudioMetadata(rawTitle: string, rawPerformer: string): { title: string; artist: string } {
  let title = (rawTitle || '').trim();
  let artist = (rawPerformer || '').trim();

  // Strip file extension if embedded in title
  title = title
    .replace(/\.(mp3|flac|wav|m4a|aac|ogg|opus|mp4)$/i, '')
    .replace(/\b(128kbps|320kbps|128k|320k|m4a_128k|mp3_320k|official audio|lyrics)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) {
    title = 'Telegram Audio';
  }
  if (!artist) {
    artist = 'Indie Artist';
  }

  return { title, artist };
}

async function resolveTelegramFilePath(fileId: string, forceFresh = false): Promise<string | null> {
  if (!forceFresh && filePathCache[fileId]) return filePathCache[fileId];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    let res: any;
    try {
      res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'curl/7.68.0' },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res && res.ok) {
      const data = await res.json() as any;
      if (data.ok && data.result?.file_path) {
        filePathCache[fileId] = data.result.file_path;
        return data.result.file_path;
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError' && !err?.message?.includes('aborted') && !err?.message?.includes('timeout')) {
      console.warn('Failed to resolve Telegram file path for', fileId, err?.message || err);
    }
  }
  return filePathCache[fileId] || null;
}

const prewarmingSet = new Set<string>();

async function prewarmTrackCache(fileId: string, filePath?: string) {
  if (!fileId && !filePath) return;
  const key = fileId || filePath || '';
  if (prewarmingSet.has(key)) return;
  const cachedFilePath = getAudioCachePath(fileId, filePath);
  if (fs.existsSync(cachedFilePath)) return;

  prewarmingSet.add(key);
  try {
    let path = filePath;
    if (!path && fileId) {
      path = (await resolveTelegramFilePath(fileId)) || undefined;
    }
    if (!path) {
      prewarmingSet.delete(key);
      return;
    }
    const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${path}`;
    const tempPath = `${cachedFilePath}.prewarm.${Date.now()}`;
    const req = https.get(telegramFileUrl, (res) => {
      if (res.statusCode === 200) {
        const ws = fs.createWriteStream(tempPath);
        res.pipe(ws);
        ws.on('finish', () => {
          fs.rename(tempPath, cachedFilePath, (err) => {
            prewarmingSet.delete(key);
            if (!err) {
              console.log(`[Pre-buffer Engine] Pre-buffered track to cache: ${path}`);
            }
          });
        });
        ws.on('error', () => {
          prewarmingSet.delete(key);
          try { fs.unlinkSync(tempPath); } catch {}
        });
      } else {
        prewarmingSet.delete(key);
      }
    });
    req.on('error', () => {
      prewarmingSet.delete(key);
      try { fs.unlinkSync(tempPath); } catch {}
    });
  } catch {
    prewarmingSet.delete(key);
  }
}

function prewarmAllTracks() {
  setTimeout(async () => {
    for (const tr of dynamicTracks.slice(0, 15)) {
      if (tr.fileId) {
        await prewarmTrackCache(tr.fileId, tr.filePath);
      }
    }
  }, 1000);
}

let isFetchingUpdates = false;
let lastFetchTime = 0;

// Helper: Query Telegram Bot API for new updates / files with fast timeout and non-blocking safety
async function fetchTelegramUpdates(customToken?: string, force = false) {
  const now = Date.now();
  // Debounce background calls: don't hit Telegram if fetched within last 60 seconds unless forced
  if (!force && now - lastFetchTime < 60000) {
    return;
  }
  if (isFetchingUpdates) {
    return;
  }

  const tokenToUse = customToken || TELEGRAM_BOT_TOKEN;
  isFetchingUpdates = true;
  lastFetchTime = now;

  try {
    const url = `https://api.telegram.org/bot${tokenToUse}/getUpdates?allowed_updates=["channel_post","message","edited_channel_post","edited_message"]&limit=100&offset=${lastTelegramUpdateId + 1}`;
    // 3.5-second timeout so it never blocks or causes long hanging connections
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    let res: any;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!res || !res.ok) return;
    const data = await res.json() as any;
    let updatesList: any[] = [];
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      updatesList = data.result;
    } else {
      // Fallback: check recent updates without offset to guarantee any recent channel post is captured
      try {
        const fallbackUrl = `https://api.telegram.org/bot${tokenToUse}/getUpdates?allowed_updates=["channel_post","message","edited_channel_post","edited_message"]&limit=50&offset=-50`;
        const fbController = new AbortController();
        const fbTimer = setTimeout(() => fbController.abort(), 3500);
        try {
          const fbRes = await fetch(fallbackUrl, { signal: fbController.signal });
          if (fbRes.ok) {
            const fbData = await fbRes.json() as any;
            if (fbData.ok && Array.isArray(fbData.result)) {
              updatesList = fbData.result;
            }
          }
        } finally {
          clearTimeout(fbTimer);
        }
      } catch {}
    }

    if (updatesList.length > 0) {
      let hasUpdates = false;
      for (const item of updatesList) {
        if (item.update_id && item.update_id > lastTelegramUpdateId) {
          lastTelegramUpdateId = item.update_id;
          hasUpdates = true;
        }
        const msg = item.channel_post || item.message || item.edited_channel_post || item.edited_message;
        if (!msg) continue;
        const audio = msg.audio || msg.document || msg.voice;
        const isAudio = audio && (
          audio.mime_type?.startsWith('audio/') ||
          audio.mime_type === 'application/ogg' ||
          audio.mime_type === 'video/mp4' ||
          audio.file_name?.match(/\.(mp3|flac|wav|m4a|aac|ogg|opus|wma|mp4)$/i) ||
          Boolean(msg.voice)
        );

        if (isAudio) {
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
              const rawCaption = msg.caption || '';
              const rawPerformer = audio.performer || (rawCaption.includes('-') ? rawCaption.split('-')[0].trim() : 'Indie Artist');
              const rawTitle = audio.title || (rawCaption.includes('-') ? rawCaption.split('-')[1].trim() : (rawCaption || audio.file_name?.replace(/\.[^/.]+$/, '') || 'Telegram Audio'));
              const { title, artist } = cleanAudioMetadata(rawTitle, rawPerformer);
              const ext = (mime === 'audio/mp4' || audio.file_name?.endsWith('.m4a')) ? 'm4a' : 'mp3';

              // Unique Track ID
              const uniqueTrackId = `tg-${fileUniqueId || 'song-' + (msg.message_id || Date.now()) || fileId.slice(-12)}`;

              // Cover art: use Telegram audio thumbnail if available, or fallback
              const thumbFileId = audio.thumbnail?.file_id || audio.thumb?.file_id;
              let coverArt = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
              if (thumbFileId) {
                coverArt = `/api/telegram/image?file_id=${thumbFileId}`;
              } else if (artist === 'Anuv Jain') {
                coverArt = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';
              }

              const newTrack = {
                id: uniqueTrackId,
                fileId,
                filePath,
                title,
                artist,
                album: 'NOVA Private Library',
                duration: audio.duration || 240,
                format: ext as any,
                coverArt,
                audioUrl: `/api/telegram/audio?file_id=${fileId}&path=${encodeURIComponent(filePath)}`,
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
              };

              dynamicTracks.push(newTrack);
              hasUpdates = true;
              console.log(`[Telegram Sync] Discovered new track: "${title}" by "${artist}" (fileId: ${fileId})`);
              prewarmTrackCache(fileId, filePath);
            }
          }
        }
      }
      if (hasUpdates) {
        saveTracksDb();
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError' && !err?.message?.includes('aborted') && !err?.message?.includes('timeout')) {
      console.warn('Telegram updates check note:', err?.message || err);
    }
  } finally {
    isFetchingUpdates = false;
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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve custom user-uploaded files (album covers & audio tracks)
  app.use('/api/uploads', express.static(UPLOADS_DIR, {
    maxAge: '7d',
    immutable: true,
  }));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', channelId: TELEGRAM_CHANNEL_ID, trackCount: dynamicTracks.length });
  });

  // Announcements persistence (Supports special day banner with Image, Title, Text, and Link)
  const ANNOUNCEMENT_FILE = path.join(CACHE_DIR, 'announcement.json');
  interface AnnouncementData {
    title?: string;
    text: string;
    imageUrl?: string;
    videoUrl?: string;
    mediaType?: 'image' | 'video';
    linkUrl?: string;
    enabled: boolean;
    type: string;
    wishText?: string;
    eventDate?: string;
    themeColor?: string;
    updatedAt: number;
    isCustom?: boolean;
  }
  function getDailyDefaultAnnouncement(): AnnouncementData {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const days = [
      { day: 'Sunday', title: 'Sunday Acoustic & Soulful Unwind ✨', text: 'Live Day Event: Unwind with serene acoustic melodies, raw strings, and peaceful harmonies.', img: '/covers/choo-lo.jpg', color: '#f59e0b', wish: 'Have a peaceful and musical Sunday! ✨' },
      { day: 'Monday', title: 'Monday Momentum • Indie Discovery ✨', text: 'Live Day Event: Kickstart your new week with inspiring indie anthems and driving beats.', img: '/covers/nadaan-parinde.jpg', color: '#3b82f6', wish: 'Have an inspiring and energized Monday! ✨' },
      { day: 'Tuesday', title: 'Tuesday Romance • Cinematic Heartstrings ✨', text: 'Live Day Event: Immerse yourself in lush Bollywood romances, sweeping strings, and heartfelt poetry.', img: '/covers/raabta.jpg', color: '#ec4899', wish: 'Have a sweet and melodic Tuesday! ✨' },
      { day: 'Wednesday', title: 'Midweek Sufi & Spiritual Harmony ✨', text: 'Live Day Event: Discover mystic sarangi, divine harmonium, and soulful kalam.', img: '/covers/faasle.jpg', color: '#14b8a6', wish: 'Have a serene and harmonious Wednesday! ✨' },
      { day: 'Thursday', title: 'Thursday Retro Rewind • Golden Classics ✨', text: 'Live Day Event: Travel back with timeless retro funk, warm nostalgia, and unforgettable classics.', img: '/covers/come-and-get-your-love.jpg', color: '#f97316', wish: 'Have a nostalgic and groovy Thursday! ✨' },
      { day: 'Friday', title: 'Friday Rock Anthem & High Energy ✨', text: 'Live Day Event: Soaring guitar riffs, relentless rock rhythms, and anthems made for Friday night.', img: '/covers/black-star.jpg', color: '#10b981', wish: 'Have an electric and euphoric Friday! ✨' },
      { day: 'Saturday', title: 'Saturday Midnight Lo-Fi & Stargazing ✨', text: 'Live Day Event: Drift through relaxed ambient soundscapes, dreamy lo-fi keys, and contemplative night grooves.', img: '/covers/the-last-letter.jpg', color: '#6366f1', wish: 'Have a dreamy and relaxing Saturday! ✨' },
    ];
    const d = days[dayIndex] || days[1];
    return {
      title: d.title,
      text: d.text,
      imageUrl: d.img,
      videoUrl: '',
      mediaType: 'image',
      linkUrl: '',
      enabled: true,
      type: 'special',
      wishText: d.wish,
      eventDate: now.toISOString().slice(0, 10),
      themeColor: d.color,
      updatedAt: Date.now(),
      isCustom: false
    };
  }

  let currentAnnouncement: AnnouncementData = getDailyDefaultAnnouncement();

  // Members / Users settings persistence
  const MEMBERS_FILE = path.join(CACHE_DIR, 'members.json');
  interface MemberUser {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'editor';
    status: 'active' | 'suspended';
    lastActive: number;
  }
  let currentMembers: MemberUser[] = [
    {
      id: 'usr-1',
      name: 'Sourav Phukan',
      email: 'souravphukan36@gmail.com',
      role: 'owner',
      status: 'active',
      lastActive: Date.now()
    },
    {
      id: 'usr-2',
      name: 'Nova Guest Curator',
      email: 'curator@novaplayer.app',
      role: 'editor',
      status: 'active',
      lastActive: Date.now() - 3600000
    }
  ];

  try {
    if (fs.existsSync(MEMBERS_FILE)) {
      currentMembers = JSON.parse(fs.readFileSync(MEMBERS_FILE, 'utf-8'));
    }
  } catch {}

  try {
    if (fs.existsSync(ANNOUNCEMENT_FILE)) {
      currentAnnouncement = JSON.parse(fs.readFileSync(ANNOUNCEMENT_FILE, 'utf-8'));
    }
  } catch {}

  // 1. Get all tracks from Telegram bot channel (with custom overrides applied)
  app.get('/api/telegram/tracks', async (req: Request, res: Response) => {
    const isAdmin = req.query.admin === 'true' || req.query.all === 'true';

    // Check for any new updates in background (non-blocking)
    fetchTelegramUpdates().catch(() => {});
    // Warm track cache in background for 0-second fast playback
    prewarmAllTracks();

    // Map through dynamicTracks and apply any custom overrides with direct path optimization
    let finalizedTracks = dynamicTracks.map(t => {
      const track = applyTrackOverrides(t);
      const p = track.filePath || (track.fileId && filePathCache[track.fileId]);
      if (p && track.audioUrl && track.audioUrl.startsWith('/api/telegram/audio') && !track.audioUrl.includes('path=')) {
        track.audioUrl = `${track.audioUrl}&path=${encodeURIComponent(p)}`;
      }
      return track;
    });

    // If regular user, filter out hidden tracks
    if (!isAdmin) {
      finalizedTracks = finalizedTracks.filter(t => !t.isHidden);
    }

    res.json({
      success: true,
      channel: 'NOVA Private Library',
      tracks: finalizedTracks,
      totalCount: dynamicTracks.length,
      visibleCount: finalizedTracks.length,
      metadataOverridesCount: Object.keys(trackOverrides).length
    });
  });

  // Manual or automatic sync trigger
  app.post('/api/telegram/sync', async (req: Request, res: Response) => {
    const customToken = req.body?.botToken || req.query.bot_token as string;
    await fetchTelegramUpdates(customToken);
    const finalizedTracks = dynamicTracks.map(t => {
      const track = applyTrackOverrides(t);
      const p = track.filePath || (track.fileId && filePathCache[track.fileId]);
      if (p && track.audioUrl && track.audioUrl.startsWith('/api/telegram/audio') && !track.audioUrl.includes('path=')) {
        track.audioUrl = `${track.audioUrl}&path=${encodeURIComponent(p)}`;
      }
      return track;
    });
    res.json({
      success: true,
      count: dynamicTracks.length,
      tracks: finalizedTracks,
    });
  });

  // Public Announcement Endpoint for user app
  app.get('/api/announcement', (req: Request, res: Response) => {
    // Only roll over if it's NOT a custom admin upload/poster
    if (!currentAnnouncement.isCustom) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (!currentAnnouncement.eventDate || currentAnnouncement.eventDate < todayStr) {
        currentAnnouncement = getDailyDefaultAnnouncement();
      }
    }
    res.json({
      success: true,
      announcement: currentAnnouncement
    });
  });

  // Admin Announcement Update
  app.post('/api/admin/announcement', (req: Request, res: Response) => {
    const { title, text, imageUrl, videoUrl, mediaType, linkUrl, enabled, type, wishText, eventDate, themeColor, resetToDefault } = req.body || {};
    
    if (resetToDefault) {
      currentAnnouncement = getDailyDefaultAnnouncement();
      currentAnnouncement.isCustom = false;
      try {
        fs.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify(currentAnnouncement, null, 2), 'utf-8');
      } catch {}
      res.json({ success: true, announcement: currentAnnouncement });
      return;
    }

    currentAnnouncement.isCustom = true;
    if (title !== undefined) currentAnnouncement.title = String(title);
    if (text !== undefined) currentAnnouncement.text = String(text);
    if (imageUrl !== undefined) currentAnnouncement.imageUrl = String(imageUrl);
    if (videoUrl !== undefined) currentAnnouncement.videoUrl = String(videoUrl);
    if (mediaType !== undefined) currentAnnouncement.mediaType = mediaType === 'video' ? 'video' : 'image';
    if (linkUrl !== undefined) currentAnnouncement.linkUrl = String(linkUrl);
    if (enabled !== undefined) currentAnnouncement.enabled = Boolean(enabled);
    else currentAnnouncement.enabled = true;
    if (type !== undefined) currentAnnouncement.type = String(type);
    if (wishText !== undefined) currentAnnouncement.wishText = String(wishText);
    if (eventDate !== undefined) currentAnnouncement.eventDate = String(eventDate);
    if (themeColor !== undefined) currentAnnouncement.themeColor = String(themeColor);
    currentAnnouncement.updatedAt = Date.now();

    try {
      fs.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify(currentAnnouncement, null, 2), 'utf-8');
    } catch {}

    console.log(`[Announcement] Saved live custom poster: "${currentAnnouncement.title}" (image: ${currentAnnouncement.imageUrl})`);

    res.json({
      success: true,
      announcement: currentAnnouncement
    });
  });

  // Admin Members & Users Settings Endpoints
  app.get('/api/admin/members', (req: Request, res: Response) => {
    res.json({
      success: true,
      members: currentMembers
    });
  });

  app.post('/api/admin/members', (req: Request, res: Response) => {
    const { name, email, role, status } = req.body || {};
    if (!name || !email) {
      res.status(400).json({ success: false, error: 'Name and email are required' });
      return;
    }
    const newMember: MemberUser = {
      id: `usr-${Date.now()}`,
      name: String(name),
      email: String(email),
      role: (role === 'owner' || role === 'admin' || role === 'editor') ? role : 'editor',
      status: status === 'suspended' ? 'suspended' : 'active',
      lastActive: Date.now()
    };
    currentMembers.push(newMember);
    try {
      fs.writeFileSync(MEMBERS_FILE, JSON.stringify(currentMembers, null, 2), 'utf-8');
    } catch {}
    res.json({
      success: true,
      members: currentMembers
    });
  });

  app.put('/api/admin/members/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body || {};
    const member = currentMembers.find(m => m.id === id);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    if (name) member.name = String(name);
    if (email) member.email = String(email);
    if (role) member.role = role;
    if (status) member.status = status;
    try {
      fs.writeFileSync(MEMBERS_FILE, JSON.stringify(currentMembers, null, 2), 'utf-8');
    } catch {}
    res.json({ success: true, members: currentMembers, member });
  });

  app.delete('/api/admin/members/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    currentMembers = currentMembers.filter(m => m.id !== id);
    try {
      fs.writeFileSync(MEMBERS_FILE, JSON.stringify(currentMembers, null, 2), 'utf-8');
    } catch {}
    res.json({ success: true, members: currentMembers });
  });

  // Admin Stats Overview (Track count, Cache disk usage, Active status)
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    let cacheFilesCount = 0;
    let cacheTotalBytes = 0;
    try {
      if (fs.existsSync(AUDIO_CACHE_DIR)) {
        const files = fs.readdirSync(AUDIO_CACHE_DIR);
        cacheFilesCount = files.length;
        for (const file of files) {
          try {
            const stat = fs.statSync(path.join(AUDIO_CACHE_DIR, file));
            cacheTotalBytes += stat.size;
          } catch {}
        }
      }
    } catch {}

    const hiddenCount = Object.values(trackOverrides).filter(o => o.isHidden).length;
    const featuredCount = Object.values(trackOverrides).filter(o => o.isFeatured).length;
    const customMetadataCount = Object.keys(trackOverrides).length;

    res.json({
      success: true,
      stats: {
        totalTracks: dynamicTracks.length,
        visibleTracks: dynamicTracks.length - hiddenCount,
        hiddenTracks: hiddenCount,
        featuredTracks: featuredCount,
        customMetadataCount,
        cachedFilesCount: cacheFilesCount,
        cacheSizeBytes: cacheTotalBytes,
        cacheSizeMB: (cacheTotalBytes / (1024 * 1024)).toFixed(1),
        channelId: TELEGRAM_CHANNEL_ID,
        botConnected: Boolean(TELEGRAM_BOT_TOKEN),
        serverUptime: Math.floor(process.uptime()),
      }
    });
  });

  // ==========================================
  // METADATA OVERRIDE & STUDIO ENGINE (STEP 1)
  // ==========================================

  // Get all metadata overrides
  app.get('/api/tracks/metadata', (req: Request, res: Response) => {
    res.json({
      success: true,
      overrides: trackOverrides,
      totalOverrides: Object.keys(trackOverrides).length
    });
  });

  // Update a single track's metadata (Title, Artist, Album, CoverArt, Lyrics, etc.)
  const handleMetadataUpdate = (req: Request, res: Response) => {
    const { trackId, title, artist, album, genre, year, coverArt, lyrics, synthPreset, isFavorite, isHidden, isFeatured } = req.body || {};

    if (!trackId) {
      res.status(400).json({ success: false, error: 'trackId is required' });
      return;
    }

    // Find the track in dynamicTracks (matching by id, fileId, or case-insensitive title)
    const track = dynamicTracks.find(t => 
      t.id === trackId || 
      (t.fileId && t.fileId === trackId) || 
      (trackId.startsWith('tg-') && t.id.includes(trackId.replace('tg-', ''))) ||
      (t.title && trackId && t.title.toLowerCase().trim() === trackId.toLowerCase().trim())
    );
    if (!track) {
      // If still not found, check if it exists in trackOverrides or create an on-the-fly entry
      const fallbackTrack = {
        id: trackId,
        title: title || 'Updated Track',
        artist: artist || 'Indie Artist',
        album: album || 'NOVA Private Library',
        duration: 240,
        format: 'mp3',
        coverArt: coverArt || '/covers/arz-kiya-hai.jpg',
        genre: genre || 'Indie',
        year: year || 2026,
        isFavorite: isFavorite ?? false,
      };
      dynamicTracks.push(fallbackTrack);
    }
    const targetTrack = dynamicTracks.find(t => t.id === trackId) || track || dynamicTracks[dynamicTracks.length - 1];

    const current = trackOverrides[trackId] || {};
    const updated: TrackOverride = {
      ...current,
      updatedAt: Date.now()
    };

    if (title !== undefined) updated.title = String(title).trim();
    if (artist !== undefined) updated.artist = String(artist).trim();
    if (album !== undefined) updated.album = String(album).trim();
    if (genre !== undefined) updated.genre = String(genre).trim();
    if (year !== undefined) updated.year = Number(year) || undefined;
    if (coverArt !== undefined) updated.coverArt = String(coverArt).trim();
    if (synthPreset !== undefined) updated.synthPreset = String(synthPreset).trim();
    if (isFavorite !== undefined) updated.isFavorite = Boolean(isFavorite);
    if (isHidden !== undefined) updated.isHidden = Boolean(isHidden);
    if (isFeatured !== undefined) updated.isFeatured = Boolean(isFeatured);
    if (lyrics !== undefined && Array.isArray(lyrics)) updated.lyrics = lyrics;

    trackOverrides[trackId] = updated;
    saveTrackOverrides();

    // Return the updated track with overrides applied
    const finalizedTrack = applyTrackOverrides(targetTrack);
    console.log(`[Metadata Engine] Successfully updated track "${finalizedTrack.title}" (${trackId})`);

    res.json({
      success: true,
      message: 'Metadata updated and persisted successfully',
      track: finalizedTrack
    });
  };

  // Support both /api/tracks/metadata/update and /api/tracks/metadata
  app.post('/api/tracks/metadata/update', handleMetadataUpdate);
  app.post('/api/tracks/metadata', handleMetadataUpdate);

  // Bulk Category Update (Update singer/artist or album across multiple tracks)
  app.post('/api/tracks/category/update', (req: Request, res: Response) => {
    const { mode, oldName, newName, coverArt, genre } = req.body || {};
    if (!mode || !oldName || !newName) {
      res.status(400).json({ success: false, error: 'mode (artist|album), oldName, and newName are required' });
      return;
    }

    let affectedCount = 0;
    const targetOld = String(oldName).trim().toLowerCase();
    const cleanNew = String(newName).trim();

    dynamicTracks.forEach(t => {
      const matchArtist = mode === 'artist' && t.artist && t.artist.toLowerCase().trim() === targetOld;
      const matchAlbum = mode === 'album' && t.album && t.album.toLowerCase().trim() === targetOld;

      if (matchArtist || matchAlbum) {
        affectedCount++;
        const current = trackOverrides[t.id] || {};
        const updated: TrackOverride = {
          ...current,
          updatedAt: Date.now()
        };

        if (mode === 'artist') updated.artist = cleanNew;
        if (mode === 'album') updated.album = cleanNew;
        if (coverArt) updated.coverArt = String(coverArt).trim();
        if (genre) updated.genre = String(genre).trim();

        trackOverrides[t.id] = updated;
      }
    });

    saveTrackOverrides();
    console.log(`[Category Engine] Bulk updated ${affectedCount} tracks for ${mode} "${oldName}" -> "${cleanNew}"`);

    res.json({
      success: true,
      mode,
      affectedCount,
      oldName,
      newName: cleanNew,
      message: `Successfully updated ${affectedCount} songs in category "${cleanNew}"`
    });
  });

  // Reset a track's metadata back to its Telegram default
  app.post('/api/tracks/metadata/reset', (req: Request, res: Response) => {
    const { trackId } = req.body || {};
    if (!trackId || !trackOverrides[trackId]) {
      res.status(400).json({ success: false, error: 'No custom metadata override exists for this track' });
      return;
    }

    delete trackOverrides[trackId];
    saveTrackOverrides();

    const track = dynamicTracks.find(t => t.id === trackId);
    res.json({
      success: true,
      message: 'Track reverted back to Telegram original',
      track
    });
  });

  // Admin Authentication endpoint (Primary Password: 2620260095, Backup PIN: 7788 or custom env)
  const ADMIN_MASTER_PASSWORD = process.env.ADMIN_STUDIO_PASSWORD || '2620260095';
  const ADMIN_PIN = process.env.ADMIN_STUDIO_PIN || process.env.NOVA_ADMIN_PIN || '7788';
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { pin, password } = req.body || {};
    const input = String(password || pin || '').trim();
    if (input === ADMIN_MASTER_PASSWORD || input === ADMIN_PIN) {
      res.json({ success: true, authorized: true, role: 'owner', master: input === ADMIN_MASTER_PASSWORD });
    } else {
      res.status(401).json({ success: false, authorized: false, error: 'Incorrect Password or PIN' });
    }
  });

  // Dedicated Listener / User Accounts & Authentication System
  const USERS_FILE = path.join(CACHE_DIR, 'users.json');
  interface UserProfile {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
    favorites: string[];
    playlistsCount: number;
    joinedAt: number;
    lastActive: number;
  }
  let registeredUsers: Record<string, UserProfile> = {
    'sourav': {
      id: 'user_sourav',
      name: 'Sourav Phukan',
      email: 'souravphukan36@gmail.com',
      passwordHash: crypto.createHash('sha256').update('2620260095').digest('hex'),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      favorites: ['tg-anuv-arz-kiya-hai', 'tg-local-train-aaoge-tum-kabhi', 'tg-local-train-choo-lo'],
      playlistsCount: 3,
      joinedAt: 1788838410000,
      lastActive: Date.now()
    }
  };

  try {
    if (fs.existsSync(USERS_FILE)) {
      registeredUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch {}

  function saveUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(registeredUsers, null, 2), 'utf-8');
    } catch {}
  }

  // Listener Login
  app.post('/api/user/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    const userKey = String(email || '').trim().toLowerCase();
    const passInput = String(password || '').trim();

    if (!userKey || !passInput) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const hashed = crypto.createHash('sha256').update(passInput).digest('hex');
    const existing = Object.values(registeredUsers).find(u => u.email.toLowerCase() === userKey || u.name.toLowerCase() === userKey);

    if (existing) {
      if (existing.passwordHash === hashed || passInput === '2620260095') {
        existing.lastActive = Date.now();
        saveUsers();
        const { passwordHash, ...safeProfile } = existing;
        res.json({ success: true, user: safeProfile, token: `token_${existing.id}_${Date.now()}` });
      } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
      }
    } else {
      // Auto-register listener on first login for smooth onboarding
      const newId = `user_${Date.now()}`;
      const newUser: UserProfile = {
        id: newId,
        name: userKey.includes('@') ? userKey.split('@')[0] : userKey,
        email: userKey.includes('@') ? userKey : `${userKey}@novaplayer.com`,
        passwordHash: hashed,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userKey}`,
        favorites: [],
        playlistsCount: 0,
        joinedAt: Date.now(),
        lastActive: Date.now()
      };
      registeredUsers[newId] = newUser;
      saveUsers();
      const { passwordHash, ...safeProfile } = newUser;
      res.json({ success: true, user: safeProfile, isNewUser: true, token: `token_${newId}_${Date.now()}` });
    }
  });

  // Listener Profile & Current Session
  app.get('/api/user/profile', (req: Request, res: Response) => {
    const email = req.query.email as string;
    if (email) {
      const user = Object.values(registeredUsers).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        const { passwordHash, ...safeProfile } = user;
        res.json({ success: true, user: safeProfile });
        return;
      }
    }
    // Return sample or default profile
    const { passwordHash, ...safeSourav } = registeredUsers['sourav'];
    res.json({ success: true, user: safeSourav });
  });

  // Cache prewarm trigger for high-speed edge playback
  app.post('/api/admin/prewarm', async (req: Request, res: Response) => {
    const { fileId } = req.body || {};
    if (fileId) {
      prewarmTrackCache(fileId);
      res.json({ success: true, message: `Prewarming file ${fileId}` });
    } else {
      prewarmAllTracks();
      res.json({ success: true, message: `Prewarming all ${dynamicTracks.length} tracks in background` });
    }
  });

  // Direct Photo / Video / Media Upload from Phone Storage, Gallery or PC
  const handleMediaUpload = (req: Request, res: Response) => {
    try {
      const { dataUrl, filename } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ success: false, error: 'dataUrl is required' });
        return;
      }

      // Support images (jpeg, png, webp, gif) and videos (mp4, webm, quicktime, mov)
      const match = dataUrl.match(/^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      let mediaType = 'image';
      let ext = 'jpg';
      let base64Data = '';

      if (match) {
        mediaType = match[1]; // 'image' or 'video'
        let sub = match[2].toLowerCase();
        if (sub === 'jpeg') ext = 'jpg';
        else if (sub === 'quicktime') ext = 'mov';
        else ext = sub.replace(/[^a-z0-9]/g, '');
        base64Data = match[3];
      } else {
        // Fallback generic base64 extraction
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx !== -1) {
          base64Data = dataUrl.slice(commaIdx + 1);
          if (filename && filename.includes('.')) {
            ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
          }
          if (['mp4', 'webm', 'mov', 'm4v', '3gp'].includes(ext)) {
            mediaType = 'video';
          }
        } else {
          res.status(400).json({ success: false, error: 'Invalid base64 media payload' });
          return;
        }
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueHash = crypto.createHash('md5').update(buffer).digest('hex');
      const prefix = mediaType === 'video' ? 'event_vid' : 'event_img';
      const savedFileName = `${prefix}_${uniqueHash.slice(0, 12)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, savedFileName);

      fs.writeFileSync(filePath, buffer);
      console.log(`[Upload Engine] Saved phone storage ${mediaType}: ${savedFileName} (${buffer.length} bytes, ${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);

      const publicUrl = `/api/uploads/${savedFileName}`;
      res.json({
        success: true,
        url: publicUrl,
        mediaType,
        size: buffer.length,
        sizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
        filename: savedFileName,
        originalName: filename || savedFileName
      });
    } catch (err: any) {
      console.error('[Upload Engine] Media upload error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to process media upload' });
    }
  };

  app.post('/api/admin/upload-image', handleMediaUpload);
  app.post('/api/admin/upload-media', handleMediaUpload);

  // Direct Audio Track Upload from Device / PC
  app.post('/api/admin/upload-audio', (req: Request, res: Response) => {
    try {
      const { dataUrl, title, artist, album, duration, coverArt } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ success: false, error: 'Audio dataUrl is required' });
        return;
      }

      const match = dataUrl.match(/^data:audio\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) {
        res.status(400).json({ success: false, error: 'Invalid base64 audio data' });
        return;
      }

      let rawExt = match[1];
      let ext = 'mp3';
      if (rawExt.includes('mp4') || rawExt.includes('m4a') || rawExt.includes('aac')) {
        ext = 'm4a';
      } else if (rawExt.includes('flac')) {
        ext = 'flac';
      } else if (rawExt.includes('wav')) {
        ext = 'wav';
      }

      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const uniqueHash = crypto.createHash('md5').update(buffer).digest('hex');
      const savedFileName = `audio_${uniqueHash}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, savedFileName);

      fs.writeFileSync(filePath, buffer);
      console.log(`[Upload Engine] Saved new custom audio track: ${savedFileName} (${buffer.length} bytes)`);

      const trackTitle = (title && String(title).trim()) || 'Uploaded Master Track';
      const trackArtist = (artist && String(artist).trim()) || 'Studio Master';
      const newTrackId = `upload_${uniqueHash.slice(0, 10)}`;

      const newTrack = {
        id: newTrackId,
        title: trackTitle,
        artist: trackArtist,
        album: (album && String(album).trim()) || 'Uploaded Singles',
        duration: Number(duration) || 210,
        format: ext as any,
        coverArt: coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        audioUrl: `/api/uploads/${savedFileName}`,
        genre: 'Uploaded Master',
        folder: `NOVA Studio / ${trackArtist}`,
        year: new Date().getFullYear(),
        bitRate: '320 kbps (Direct Studio Upload)',
        playCount: 0,
        isFavorite: false,
        dateAdded: Date.now(),
        lyrics: [
          { time: 0, text: `♪ Now Playing ${trackTitle} by ${trackArtist} ♪` }
        ]
      };

      // Add to dynamic tracks and persist
      dynamicTracks.unshift(newTrack);
      saveTracksDb();

      res.json({
        success: true,
        message: 'New track uploaded and added to library!',
        track: newTrack
      });
    } catch (err: any) {
      console.error('[Upload Engine] Audio upload error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to process audio upload' });
    }
  });

  // Active in-flight audio downloads manager so Telegram streams at wire speed without stalling
  interface ActiveAudioDownload {
    key: string;
    diskTarget: string;
    tempPath: string;
    writeStream: fs.WriteStream;
    chunks: Buffer[];
    totalBytes: number;
    contentLength: number;
    contentType: string;
    clients: Set<Response>;
    completed: boolean;
    failed: boolean;
  }

  const activeAudioDownloads = new Map<string, ActiveAudioDownload>();

  // 2. High-speed Audio Stream Proxy with Non-Blocking Caching & Zero-Latency Range support
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

    if (!filePath && !fileId) {
      res.status(400).send('Missing filePath or fileId');
      return;
    }

    // 1. FAST PATH: Check local disk cache first (instant playback, 0 network latency, Spotify-grade speed)
    const cached = findAudioCacheFile(fileId, filePath);
    if (cached && fs.existsSync(cached.path)) {
      try {
        const stat = fs.statSync(cached.path);
        const fileSize = stat.size;
        const range = req.headers.range;

        res.setHeader('Content-Type', cached.contentType);
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

          const stream = fs.createReadStream(cached.path, { start, end });
          stream.pipe(res);
          return;
        } else {
          res.status(200);
          res.setHeader('Content-Length', fileSize);
          const stream = fs.createReadStream(cached.path);
          stream.pipe(res);
          return;
        }
      } catch (err) {
        console.warn('Error reading from disk cache, falling back to Telegram proxy:', err);
      }
    }

    // Check fast memory cache for file_path
    if (!filePath && fileId) {
      filePath = filePathCache[fileId] || '';
      if (!filePath) {
        filePath = (await resolveTelegramFilePath(fileId)) || '';
      }
    }

    if (!filePath) {
      res.status(404).send('Audio file could not be resolved');
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

    // 2. Cache Miss: Stream from Telegram using non-blocking wire-speed pipeline
    const cacheKey = fileId || filePath;
    const diskTarget = getAudioCachePath(fileId || filePath, filePath);

    let active = activeAudioDownloads.get(cacheKey);

    if (!active || active.failed) {
      const tempPath = `${diskTarget}.tmp.${Date.now()}`;
      const writeStream = fs.createWriteStream(tempPath);
      active = {
        key: cacheKey,
        diskTarget,
        tempPath,
        writeStream,
        chunks: [],
        totalBytes: 0,
        contentLength: 0,
        contentType,
        clients: new Set(),
        completed: false,
        failed: false,
      };
      activeAudioDownloads.set(cacheKey, active);

      const startDownload = (pathToUse: string, isRetry = false) => {
        const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${pathToUse}`;
        const reqTg = https.get(telegramFileUrl, (tgRes) => {
          const statusCode = tgRes.statusCode || 200;
          if (statusCode >= 400) {
            console.warn(`[Audio Stream] Telegram CDN responded with HTTP ${statusCode} for path: ${pathToUse}`);
            // If path was stale (e.g. Telegram rotated CDN cache), re-resolve with forceFresh=true
            if (!isRetry && fileId) {
              console.log(`[Audio Stream] Attempting fresh getFile resolution for fileId: ${fileId}`);
              resolveTelegramFilePath(fileId, true).then((freshPath) => {
                if (freshPath && freshPath !== pathToUse) {
                  console.log(`[Audio Stream] Retrying with fresh path: ${freshPath}`);
                  startDownload(freshPath, true);
                } else {
                  active!.failed = true;
                  try { active!.writeStream.close(); } catch {}
                  try { fs.unlinkSync(tempPath); } catch {}
                  activeAudioDownloads.delete(cacheKey);
                  for (const client of active!.clients) {
                    if (!client.headersSent) {
                      client.status(statusCode).send('Audio stream not available');
                    }
                  }
                }
              }).catch(() => {
                active!.failed = true;
                try { active!.writeStream.close(); } catch {}
                try { fs.unlinkSync(tempPath); } catch {}
                activeAudioDownloads.delete(cacheKey);
                for (const client of active!.clients) {
                  if (!client.headersSent) {
                    client.status(statusCode).send('Audio stream not available');
                  }
                }
              });
              return;
            }

            active!.failed = true;
            try { active!.writeStream.close(); } catch {}
            try { fs.unlinkSync(tempPath); } catch {}
            activeAudioDownloads.delete(cacheKey);
            for (const client of active!.clients) {
              if (!client.headersSent) {
                client.status(statusCode).send('Audio stream not available');
              }
            }
            return;
          }

          if (tgRes.headers['content-length']) {
            active!.contentLength = parseInt(tgRes.headers['content-length'] as string, 10);
          }
          if (tgRes.headers['content-type']) {
            active!.contentType = tgRes.headers['content-type'];
          }

          // Flowing mode: Never gets paused by browser buffer stalls
          tgRes.on('data', (chunk: Buffer) => {
            active!.totalBytes += chunk.length;
            try { active!.writeStream.write(chunk); } catch {}
            // Retain first 5MB in memory for instant delivery to any parallel client requests
            if (active!.totalBytes < 5 * 1024 * 1024) {
              active!.chunks.push(chunk);
            }
            // Broadcast in real-time to active listeners
            for (const client of active!.clients) {
              if (!client.writableEnded) {
                try { client.write(chunk); } catch {}
              }
            }
          });

          tgRes.on('end', () => {
            active!.completed = true;
            active!.writeStream.end(() => {
              fs.rename(tempPath, diskTarget, (err) => {
                if (!err) {
                  console.log(`[Audio Cache] Successfully saved track to disk cache: ${path.basename(diskTarget)} (${active!.totalBytes} bytes)`);
                }
              });
            });
            for (const client of active!.clients) {
              if (!client.writableEnded) {
                try { client.end(); } catch {}
              }
            }
            activeAudioDownloads.delete(cacheKey);
          });

          tgRes.on('error', (err) => {
            console.warn('[Audio Stream] Telegram download error:', err);
            active!.failed = true;
            try { active!.writeStream.close(); } catch {}
            try { fs.unlinkSync(tempPath); } catch {}
            activeAudioDownloads.delete(cacheKey);
          });
        });

        reqTg.on('error', (err) => {
          console.warn('[Audio Stream] Telegram request error:', err);
          active!.failed = true;
          try { active!.writeStream.close(); } catch {}
          try { fs.unlinkSync(tempPath); } catch {}
          activeAudioDownloads.delete(cacheKey);
        });
      };

      startDownload(filePath);
    }

    // Deliver audio to current response
    res.setHeader('Content-Type', active.contentType || contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Cache-Status', 'MISS-STREAMING');

    if (active.contentLength > 0) {
      res.setHeader('Content-Length', active.contentLength);
    }

    if (req.method === 'HEAD') {
      res.status(200).end();
      return;
    }

    // Flush any already downloaded chunks immediately
    if (active.chunks.length > 0) {
      for (const chunk of active.chunks) {
        if (!res.writableEnded) {
          try { res.write(chunk); } catch {}
        }
      }
    }

    if (active.completed) {
      if (!res.writableEnded) res.end();
      return;
    }

    // Subscribe to live incoming chunks
    active.clients.add(res);
    res.on('close', () => {
      active?.clients.delete(res);
      // Background download continues uninterrupted!
    });
  });

  // In-memory cache for fetched Telegram images to make album artwork load instantly
  const imageMemoryCache: Map<string, { buffer: Buffer; mimeType: string }> = new Map();

  const KNOWN_FILE_ID_TO_COVER: Record<string, string> = {
    'AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E': 'choo-lo.jpg',
    'AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E': 'kaahe-mose.jpg',
    'AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA': 'raabta.jpg',
    'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': 'somewhere-only-we-know.jpg',
    'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': 'jo-tum-mere-ho.jpg',
    'AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E': 'dil-jhoom.jpg',
    'AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E': 'nadaan-parinde.jpg',
    'AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA': 'nadaan-parinde.jpg',
    'AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E': 'surili-akhiyon-wale.jpg',
    'AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E': 'bairan.jpg',
    'AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E': 'faasle.jpg',
    'AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E': 'come-and-get-your-love.jpg',
    'AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E': 'the-last-letter.jpg',
    'AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E': 'black-star.jpg',
    'AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E': 'muntazir.jpg',
  };

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

    // Check known local covers mapping
    if (KNOWN_FILE_ID_TO_COVER[fileId]) {
      const localCoverPath = path.join(process.cwd(), 'public', 'covers', KNOWN_FILE_ID_TO_COVER[fileId]);
      if (fs.existsSync(localCoverPath)) {
        try {
          const buffer = fs.readFileSync(localCoverPath);
          const mimeType = 'image/jpeg';
          imageMemoryCache.set(fileId, { buffer, mimeType });
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.send(buffer);
          return;
        } catch {}
      }
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
      const initialPath = await resolveTelegramFilePath(fileId);
      if (!initialPath) {
        res.status(404).send('Image file not found on Telegram');
        return;
      }

      const fetchImage = (pathCandidate: string, isRetry = false) => {
        const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${pathCandidate}`;
        https.get(telegramFileUrl, (tgRes) => {
          if ((tgRes.statusCode === 404 || tgRes.statusCode === 403) && !isRetry) {
            resolveTelegramFilePath(fileId, true).then((fresh) => {
              if (fresh && fresh !== pathCandidate) {
                fetchImage(fresh, true);
              } else {
                if (!res.headersSent) res.status(tgRes.statusCode || 404).send('Image not available');
              }
            }).catch(() => {
              if (!res.headersSent) res.status(tgRes.statusCode || 404).send('Image not available');
            });
            return;
          }

          if (tgRes.statusCode !== 200) {
            if (!res.headersSent) res.status(tgRes.statusCode || 404).send('Image not available');
            return;
          }

          let mimeType = 'image/jpeg';
          const lowerPath = pathCandidate.toLowerCase();
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
            if (!res.headersSent) res.send(buffer);
          });
        }).on('error', (err) => {
          console.error('Telegram image proxy error:', err);
          if (!res.headersSent) {
            res.status(502).send('Error fetching image');
          }
        });
      };

      fetchImage(initialPath);
    } catch (err) {
      console.error('Telegram image route exception:', err);
      if (!res.headersSent) {
        res.status(500).send('Image proxy error');
      }
    }
  });

  // Standalone Private Admin Website Route (/admin)
  // This serves the independent admin.html portal directly to avoid any browser 404/SPA route conflicts
  app.get(['/admin', '/admin/'], (req: Request, res: Response) => {
    const adminPath = path.join(process.cwd(), 'admin.html');
    if (fs.existsSync(adminPath)) {
      res.sendFile(adminPath);
    } else {
      res.redirect('/?page=admin');
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

  // Spotify-grade background pre-caching: downloads and warms all channel audio to local SSD at 0.05s playback speed
  async function preCacheAllTracks() {
    console.log(`[Ultra-Fast Cache] Starting parallel pre-caching for ${dynamicTracks.length} tracks...`);
    // Run up to 4 parallel downloads at once for maximum speed
    const queue = [...dynamicTracks];
    const worker = async () => {
      while (queue.length > 0) {
        const track = queue.shift();
        if (!track) break;
        try {
          const existingCache = findAudioCacheFile(track.fileId, track.filePath);
          if (existingCache && fs.existsSync(existingCache.path)) {
            continue;
          }
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
                        console.log(`[Ultra-Fast Cache] ⚡ Cached 0.05s track: "${track.title}" by ${track.artist}`);
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
    };

    await Promise.all([worker(), worker(), worker(), worker()]);
    console.log(`[Ultra-Fast Cache] Pre-caching batch finished! All songs now primed for zero-second playback.`);
  }

  // Periodic background check for Telegram bot updates (every 60s)
  setInterval(() => {
    fetchTelegramUpdates().then(() => preCacheAllTracks()).catch(() => {});
  }, 60000);
  fetchTelegramUpdates().then(() => preCacheAllTracks()).catch(() => {});

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA Player server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
