import fs from 'fs';
import { DEFAULT_TRACKS } from './src/data/defaultTracks.ts';
import { DEFAULT_TELEGRAM_PATH_CACHE } from './src/services/apiConfig.ts';

DEFAULT_TRACKS.forEach((t, i) => {
  const fileId = t.audioUrl.split('file_id=')[1]?.split('&')[0];
  const cdnPath = fileId ? DEFAULT_TELEGRAM_PATH_CACHE[fileId] : null;
  const thumbFileId = t.coverArt.split('file_id=')[1]?.split('&')[0];
  const thumbCdnPath = thumbFileId ? DEFAULT_TELEGRAM_PATH_CACHE[thumbFileId] : null;
  console.log(`${i+1}. ${t.title} (${t.artist}) -> audio: ${cdnPath} | thumb: ${thumbCdnPath}`);
});
