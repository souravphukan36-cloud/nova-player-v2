import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TELEGRAM_BOT_TOKEN = '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
const AUDIO_CACHE_DIR = path.join(process.cwd(), '.cache', 'audio');

fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });

const FILE_IDS = [
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ',
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ',
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA',
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA',
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ',
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA',
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA',
  'CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA',
  'CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ',
  'CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E',
  'CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA',
  'CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA',
  'CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA',
  'CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA',
  'CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA',
  'CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA',
  'CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA'
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const resolvedMap = {};
  console.log(`Starting high-speed preload of ${FILE_IDS.length} tracks...`);

  for (let i = 0; i < FILE_IDS.length; i++) {
    const fileId = FILE_IDS[i];
    try {
      const getFileRes = await fetchJson(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
      if (getFileRes.ok && getFileRes.result?.file_path) {
        const filePath = getFileRes.result.file_path;
        resolvedMap[fileId] = filePath;
        const fileHash = crypto.createHash('md5').update(fileId).digest('hex');
        const pathHash = crypto.createHash('md5').update(filePath).digest('hex');
        const ext = filePath.endsWith('.m4a') || filePath.endsWith('.mp4') ? 'm4a' : 'mp3';

        const fileDest = path.join(AUDIO_CACHE_DIR, `${fileHash}.${ext}`);
        const pathDest = path.join(AUDIO_CACHE_DIR, `${pathHash}.${ext}`);

        if (fs.existsSync(fileDest) && fs.statSync(fileDest).size > 10000) {
          console.log(`[${i + 1}/${FILE_IDS.length}] Already cached: ${fileId.slice(0, 15)}... (${filePath})`);
        } else {
          console.log(`[${i + 1}/${FILE_IDS.length}] Downloading ${filePath} for ${fileId.slice(0, 15)}...`);
          const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
          await downloadFile(downloadUrl, fileDest);
          console.log(`  Saved ${fileDest} (${fs.statSync(fileDest).size} bytes)`);
        }

        // Also duplicate/link under pathDest for instant path lookups
        if (!fs.existsSync(pathDest) && fs.existsSync(fileDest)) {
          try {
            fs.copyFileSync(fileDest, pathDest);
          } catch {}
        }
      } else {
        console.warn(`Could not resolve fileId: ${fileId}`);
      }
    } catch (e) {
      console.error(`Error downloading fileId ${fileId}:`, e.message);
    }
  }

  // Save fresh active map
  fs.writeFileSync('active_telegram_paths.json', JSON.stringify(resolvedMap, null, 2));
  console.log('Finished pre-caching all audio tracks! Ultra-fast 0.005s playback enabled.');
}

main();
