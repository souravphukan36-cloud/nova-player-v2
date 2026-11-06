import fs from 'fs';
const tracksData = fs.readFileSync('src/data/defaultTracks.ts', 'utf8');
const coversDir = fs.readdirSync('public/covers');
console.log('Available cover files:', coversDir);
