import https from 'https';
import fs from 'fs';
import path from 'path';

const TOKEN = '8717270921:AAFxvHPnWWawsJOf8ZONGJXdu-qatjD4X6g';
const CHANNEL_ID = '-1003542494794';

function post(method, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function cleanTitle(title, filename) {
  let t = title || filename || 'NOVA Track';
  t = t.replace(/\(PenduJatt\.Com\.Se\)|\(PenduJatt\.Com\)|\[.*?\]/gi, '').trim();
  t = t.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/gi, '').trim();
  return t;
}

async function run() {
  console.log('Finding highest channel message_id...');
  let maxId = 215;
  try {
    const init = await post('sendMessage', {
      chat_id: CHANNEL_ID,
      text: 'sync_init',
      disable_notification: true
    });
    if (init && init.ok && init.result && init.result.message_id) {
      maxId = init.result.message_id;
      await post('deleteMessage', { chat_id: CHANNEL_ID, message_id: maxId }).catch(() => {});
    }
  } catch (e) {
    console.warn('Using default maxId:', maxId);
  }

  console.log(`Scanning channel message IDs from ${maxId} down to 1...`);
  const scannedTracks = [];
  const seenIds = new Set();

  for (let mid = maxId; mid >= 1; mid--) {
    try {
      const fwd = await post('forwardMessage', {
        chat_id: CHANNEL_ID,
        from_chat_id: CHANNEL_ID,
        message_id: mid,
        disable_notification: true
      });

      if (fwd && fwd.ok && fwd.result) {
        const newMsgId = fwd.result.message_id;
        const msg = fwd.result;

        // Delete duplicate immediately
        await post('deleteMessage', { chat_id: CHANNEL_ID, message_id: newMsgId }).catch(() => {});

        const audio = msg.audio || msg.document || msg.voice;
        if (audio) {
          const mime = audio.mime_type || '';
          const fname = audio.file_name || '';
          const isAudio = mime.startsWith('audio/') || mime === 'application/ogg' || /\.(mp3|m4a|wav|flac|aac|ogg)$/i.test(fname);

          if (isAudio) {
            const fileId = audio.file_id;
            const uniqueId = audio.file_unique_id || String(mid);

            if (!seenIds.has(fileId)) {
              seenIds.add(fileId);

              const rawTitle = audio.title || fname || `Track ${mid}`;
              const artist = audio.performer || 'Zubeen Garg';
              const title = cleanTitle(rawTitle, fname);
              const duration = audio.duration || 240;
              const fmt = (fname.toLowerCase().endsWith('.m4a') || mime === 'audio/mp4') ? 'm4a' : 'mp3';

              const thumb = audio.thumbnail || audio.thumb;
              const thumbFileId = thumb ? thumb.file_id : null;
              const coverArt = thumbFileId
                ? `/api/telegram/image?file_id=${thumbFileId}`
                : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';

              const track = {
                id: `tg-vault-${uniqueId}`,
                fileId: fileId,
                title: title,
                artist: artist,
                album: 'NOVA Private Vault',
                duration: duration,
                format: fmt,
                coverArt: coverArt,
                audioUrl: `/api/telegram/audio?file_id=${fileId}`,
                genre: 'Assamese / Regional Master',
                folder: `NOVA Private Library / ${artist}`,
                year: 2024,
                bitRate: '320 kbps (Telegram Studio Master)',
                playCount: 0,
                isFavorite: false,
                dateAdded: (msg.date || Math.floor(Date.now() / 1000)) * 1000,
                lyrics: [
                  { time: 0, text: `♪ ${title} - ${artist} ♪` }
                ]
              };

              scannedTracks.push(track);
              console.log(`[${scannedTracks.length}] Mid ${mid}: "${title}" by "${artist}" (${duration}s)`);
            }
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    // Small delay to be gentle on Telegram Bot API
    await new Promise(r => setTimeout(r, 40));
  }

  console.log(`\nScan finished! Recovered ${scannedTracks.length} tracks.`);

  const destTs = path.join(process.cwd(), 'src', 'data', 'telegramRecoveredTracks.ts');
  const tsContent = `import { Track } from '../types';\n\nexport const TELEGRAM_VAULT_TRACKS: Track[] = ${JSON.stringify(scannedTracks, null, 2)} as Track[];\n`;

  fs.writeFileSync(destTs, tsContent, 'utf-8');
  console.log(`Written ${scannedTracks.length} tracks to ${destTs}`);

  const destJson = path.join(process.cwd(), '.cache', 'dynamic_tracks.json');
  fs.mkdirSync(path.dirname(destJson), { recursive: true });
  fs.writeFileSync(destJson, JSON.stringify(scannedTracks, null, 2), 'utf-8');
  console.log(`Written ${scannedTracks.length} tracks to ${destJson}`);
}

run().catch(console.error);
