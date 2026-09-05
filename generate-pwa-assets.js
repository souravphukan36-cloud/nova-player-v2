import sharp from 'sharp';
import fs from 'fs';

async function generate() {
  const svgBuffer = fs.readFileSync('./public/icon.svg');

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192.png');
  console.log('Created icon-192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512.png');
  console.log('Created icon-512.png');

  // Maskable 512x512 PNG (with safe zone padding)
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 10, g: 8, b: 18, alpha: 1 }
    })
    .png()
    .toFile('./public/icon-maskable-512.png');
  console.log('Created icon-maskable-512.png');

  // Mobile screenshots for store ready
  // 1080x1920 screenshot 1
  const screenshot1Svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#0A0912"/>
      <circle cx="540" cy="500" r="300" fill="#7C6EFF" opacity="0.15"/>
      <rect x="140" y="240" width="800" height="800" rx="48" fill="#151324" stroke="#7C6EFF" stroke-width="4"/>
      <circle cx="540" cy="640" r="220" fill="#201C38"/>
      <text x="540" y="1180" font-family="sans-serif" font-size="64" font-weight="bold" fill="#FFFFFF" text-anchor="middle">NOVA Player</text>
      <text x="540" y="1260" font-family="sans-serif" font-size="36" fill="#9E92FF" text-anchor="middle">Developed by Sourav Phukan</text>
      <rect x="140" y="1360" width="800" height="24" rx="12" fill="#2A2645"/>
      <rect x="140" y="1360" width="450" height="24" rx="12" fill="#7C6EFF"/>
      <circle cx="540" cy="1560" r="70" fill="#7C6EFF"/>
    </svg>
  `);

  await sharp(screenshot1Svg)
    .resize(1080, 1920)
    .png()
    .toFile('./public/screenshot1.png');
  console.log('Created screenshot1.png');

  // Screenshot 2
  const screenshot2Svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#0A0912"/>
      <text x="540" y="240" font-family="sans-serif" font-size="56" font-weight="bold" fill="#FFFFFF" text-anchor="middle">5-Band Studio Equalizer</text>
      <text x="540" y="320" font-family="sans-serif" font-size="32" fill="#7C6EFF" text-anchor="middle">SoundAlive DSP Engine</text>
      <g transform="translate(180, 480)">
        <rect x="0" y="0" width="100" height="700" rx="50" fill="#18152A"/>
        <circle cx="50" cy="250" r="40" fill="#7C6EFF"/>
        <rect x="180" y="0" width="100" height="700" rx="50" fill="#18152A"/>
        <circle cx="230" cy="180" r="40" fill="#7C6EFF"/>
        <rect x="360" y="0" width="100" height="700" rx="50" fill="#18152A"/>
        <circle cx="410" cy="360" r="40" fill="#7C6EFF"/>
        <rect x="540" y="0" width="100" height="700" rx="50" fill="#18152A"/>
        <circle cx="590" cy="140" r="40" fill="#7C6EFF"/>
        <rect x="720" y="0" width="100" height="700" rx="50" fill="#18152A"/>
        <circle cx="770" cy="220" r="40" fill="#7C6EFF"/>
      </g>
      <rect x="140" y="1360" width="800" height="260" rx="40" fill="#161326" stroke="#7C6EFF" stroke-width="2"/>
      <text x="540" y="1500" font-family="sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Bass Boost &amp; 3D Surround</text>
    </svg>
  `);

  await sharp(screenshot2Svg)
    .resize(1080, 1920)
    .png()
    .toFile('./public/screenshot2.png');
  console.log('Created screenshot2.png');
}

generate().catch(console.error);
