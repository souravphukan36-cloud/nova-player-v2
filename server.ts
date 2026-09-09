import express, { Request, Response } from 'express';
import path from 'path';
import https from 'https';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003542494794';

// Preset baseline of all 5 songs uploaded by Sourav in the Telegram channel
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

// In-memory track store that can dynamically include any newly detected songs
let dynamicTracks = [...BASE_TRACKS];

// Cache resolved Telegram file_paths so we don't spam getFile API
const filePathCache: Record<string, string> = {
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'music/file_2',
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'music/file_3',
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'music/file_4',
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'music/file_0.mp3',
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'music/file_6.m4a'
};

// Explicit MIME type mapping for high-fidelity audio playback across Chrome/Android/iOS
const fileMimeCache: Record<string, string> = {
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'audio/mpeg', // Arz Kiya Hai (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'audio/mp4',  // Aaoge Tum Kabhi (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'audio/mp4',  // Choo Lo (.m4a)
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'audio/mpeg', // Kaahe Mose (.mp3)
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'audio/mp4',  // Raabta (.m4a)
  'music/file_2': 'audio/mpeg',
  'music/file_3': 'audio/mp4',
  'music/file_4': 'audio/mp4',
  'music/file_0.mp3': 'audio/mpeg',
  'music/file_6.m4a': 'audio/mp4'
};

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
              const performer = audio.performer || 'Indie Artist';
              const title = audio.title || audio.file_name?.replace(/\.[^/.]+$/, '') || 'Telegram Audio';
              const ext = (mime === 'audio/mp4' || audio.file_name?.endsWith('.m4a')) ? 'm4a' : 'mp3';

              // Unique Track ID
              const uniqueTrackId = `tg-${fileUniqueId || 'song-' + msg.message_id || fileId.slice(-12)}`;

              // Cover art: use Telegram audio thumbnail if available, or fallback
              const thumbFileId = audio.thumbnail?.file_id || audio.thumb?.file_id;
              let coverArt = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
              if (thumbFileId) {
                coverArt = `/api/telegram/image?file_id=${thumbFileId}`;
              }

              dynamicTracks.push({
                id: uniqueTrackId,
                fileId,
                filePath,
                title,
                artist: performer,
                album: 'NOVA Private Library',
                duration: audio.duration || 240,
                format: ext as any,
                coverArt,
                audioUrl: `/api/telegram/audio?file_id=${fileId}`,
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

  // 2. High-speed Audio Stream Proxy (passes Range headers for seeking & 10-band EQ)
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

      // Determine content-type based on explicit fileMimeCache, then filename/extension
      let contentType = (fileId && fileMimeCache[fileId]) || fileMimeCache[filePath];
      if (!contentType) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        if (ext === 'm4a' || ext === 'mp4' || ext === 'aac' || filePath.includes('file_3') || filePath.includes('file_4') || filePath.includes('file_6')) {
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

      res.status(statusCode);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

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

      tgRes.pipe(res);
    }).on('error', (err) => {
      console.error('Telegram streaming proxy error:', err);
      if (!res.headersSent) {
        res.status(502).send('Error streaming audio from Telegram');
      }
    });
  });

  // 3. Image Proxy for Telegram Track Thumbnails / Album Covers
  app.get('/api/telegram/image', async (req: Request, res: Response) => {
    const fileId = req.query.file_id as string;
    if (!fileId) {
      res.status(400).send('Missing file_id');
      return;
    }

    try {
      const filePath = await resolveTelegramFilePath(fileId);
      if (!filePath) {
        res.status(404).send('Image file not found on Telegram');
        return;
      }

      const telegramFileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
      https.get(telegramFileUrl, (tgRes) => {
        res.status(tgRes.statusCode || 200);
        res.setHeader('Content-Type', tgRes.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        tgRes.pipe(res);
      }).on('error', (err) => {
        console.error('Telegram image proxy error:', err);
        if (!res.headersSent) {
          res.status(502).send('Error fetching image');
        }
      });
    } catch (err) {
      res.status(500).send('Image proxy error');
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

  // Start background periodic polling for Telegram bot updates
  setInterval(() => {
    fetchTelegramUpdates().catch(() => {});
  }, 20000);
  fetchTelegramUpdates().catch(() => {});

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA Player server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
