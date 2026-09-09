import express, { Request, Response } from 'express';
import path from 'path';
import https from 'https';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003542494794';

// Preset baseline of the 3 songs uploaded by Sourav in the Telegram channel
const BASE_TRACKS = [
  {
    id: 'tg-anuv-arz-kiya-hai',
    fileId: 'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ',
    filePath: 'music/file_1.mp3',
    title: 'Arz Kiya Hai',
    artist: 'Anuv Jain',
    album: 'Arz Kiya Hai - Single',
    duration: 305,
    format: 'mp3',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    audioUrl: '/api/telegram/audio?path=music/file_1.mp3',
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
    filePath: 'music/file_2.m4a',
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
    filePath: 'music/file_0.m4a',
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
  }
];

// In-memory track store that can dynamically include any newly detected songs
let dynamicTracks = [...BASE_TRACKS];

// Helper: Query Telegram Bot API for new updates / files
async function fetchTelegramUpdates() {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?allowed_updates=["channel_post","message"]&limit=100`;
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
          // Check if already in dynamicTracks
          const exists = dynamicTracks.some(t => t.fileId === fileId || t.title.toLowerCase() === (audio.title || '').toLowerCase());
          if (!exists) {
            // Retrieve file path from Telegram
            const fileInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
            if (fileInfoRes.ok) {
              const fileInfo = await fileInfoRes.json() as any;
              if (fileInfo.ok && fileInfo.result?.file_path) {
                const filePath = fileInfo.result.file_path;
                const performer = audio.performer || 'Indie Artist';
                const title = audio.title || audio.file_name?.replace(/\.[^/.]+$/, '') || 'Telegram Audio';
                const ext = audio.file_name?.split('.').pop()?.toLowerCase() || 'm4a';

                dynamicTracks.push({
                  id: `tg-${fileId.substring(0, 16)}`,
                  fileId,
                  filePath,
                  title,
                  artist: performer,
                  album: 'NOVA Private Library',
                  duration: audio.duration || 210,
                  format: ext as any,
                  coverArt: performer.toLowerCase().includes('anuv')
                    ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
                  audioUrl: `/api/telegram/audio?path=${encodeURIComponent(filePath)}&file_id=${fileId}`,
                  synthPreset: 'acoustic',
                  genre: 'Telegram Cloud Music',
                  folder: `NOVA Private Library / ${performer}`,
                  year: new Date().getFullYear(),
                  bitRate: '320 kbps (Telegram Cloud Master)',
                  playCount: 0,
                  isFavorite: false,
                  dateAdded: (msg.date || Math.floor(Date.now() / 1000)) * 1000,
                  lyrics: [
                    { time: 0, text: `♪ Now Playing ${title} by ${performer} ♪` }
                  ]
                });
              }
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

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', channelId: TELEGRAM_CHANNEL_ID });
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

  // 2. High-speed Audio Stream Proxy (passes Range headers for seeking & 10-band EQ)
  app.get('/api/telegram/audio', async (req: Request, res: Response) => {
    let filePath = req.query.path as string;
    const fileId = req.query.file_id as string;

    // If only file_id is provided, resolve file path first
    if (!filePath && fileId) {
      try {
        const fileInfoRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        if (fileInfoRes.ok) {
          const info = await fileInfoRes.json() as any;
          if (info.ok && info.result?.file_path) {
            filePath = info.result.file_path;
          }
        }
      } catch (e) {
        console.warn('Error resolving file_id:', e);
      }
    }

    if (!filePath) {
      res.status(400).send('Missing filePath or fileId');
      return;
    }

    const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    https.get(telegramFileUrl, { headers }, (tgRes) => {
      const statusCode = tgRes.statusCode || 200;

      // Determine content-type based on extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      let contentType = 'audio/mpeg';
      if (ext === 'm4a' || ext === 'mp4' || ext === 'aac') {
        contentType = 'audio/mp4';
      } else if (ext === 'flac') {
        contentType = 'audio/flac';
      } else if (ext === 'wav') {
        contentType = 'audio/wav';
      } else if (ext === 'ogg') {
        contentType = 'audio/ogg';
      }

      res.status(statusCode);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (tgRes.headers['content-range']) {
        res.setHeader('Content-Range', tgRes.headers['content-range']);
      }
      if (tgRes.headers['content-length']) {
        res.setHeader('Content-Length', tgRes.headers['content-length']);
      }

      tgRes.pipe(res);
    }).on('error', (err) => {
      console.error('Telegram streaming proxy error:', err);
      if (!res.headersSent) {
        res.status(502).send('Error streaming audio from Telegram');
      }
    });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA Player server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
