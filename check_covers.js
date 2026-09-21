import fs from 'fs';
import { DEFAULT_TELEGRAM_PATH_CACHE, DEFAULT_TELEGRAM_BOT_TOKEN } from './src/services/apiConfig.ts';
import https from 'https';

console.log('Checking covers in cache:');
for (const [fileId, filePath] of Object.entries(DEFAULT_TELEGRAM_PATH_CACHE)) {
  if (filePath.startsWith('thumbnails/')) {
    const url = `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${filePath}`;
    https.get(url, (res) => {
      console.log(filePath, 'status:', res.statusCode, 'content-type:', res.headers['content-type'], 'size:', res.headers['content-length']);
    }).on('error', (e) => {
      console.log(filePath, 'error:', e.message);
    });
  }
}
