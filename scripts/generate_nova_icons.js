import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="novaSpaceBg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#16152B"/>
      <stop offset="45%" stop-color="#0B0D16"/>
      <stop offset="100%" stop-color="#040508"/>
    </radialGradient>

    <!-- Core Gradients -->
    <linearGradient id="neonPulse" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE"/>
      <stop offset="45%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#F43F5E"/>
    </linearGradient>

    <linearGradient id="cyanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>

    <linearGradient id="goldFire" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="novaGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="128" fill="url(#novaSpaceBg)"/>

  <!-- Subtle Outer Metallic Rim -->
  <rect x="6" y="6" width="500" height="500" rx="122" fill="none" stroke="url(#cyanPurple)" stroke-width="3" opacity="0.35"/>

  <!-- Ambient Cosmic Aura -->
  <circle cx="256" cy="256" r="160" fill="#7C3AED" opacity="0.18" filter="url(#novaGlow)"/>
  <circle cx="256" cy="256" r="110" fill="#00F2FE" opacity="0.14" filter="url(#novaGlow)"/>

  <!-- Concentric Soundwave Orbit Rings -->
  <circle cx="256" cy="256" r="175" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="8 14" opacity="0.3"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#C084FC" stroke-width="3.5" stroke-dasharray="16 12" opacity="0.5"/>
  <circle cx="256" cy="256" r="105" fill="none" stroke="#00F2FE" stroke-width="2" stroke-dasharray="6 8" opacity="0.45"/>

  <!-- Pulsing Soundwave Frequency Equalizer Bars Orbiting in Hexagon -->
  <g opacity="0.65" stroke="url(#cyanPurple)" stroke-width="3" stroke-linecap="round">
    <!-- Top & Bottom vertical sound spikes -->
    <line x1="256" y1="64" x2="256" y2="86"/>
    <line x1="256" y1="426" x2="256" y2="448"/>
    <!-- Left & Right -->
    <line x1="64" y1="256" x2="86" y2="256"/>
    <line x1="426" y1="256" x2="448" y2="256"/>
    <!-- Diagonals -->
    <line x1="120" y1="120" x2="136" y2="136"/>
    <line x1="392" y1="120" x2="376" y2="136"/>
    <line x1="120" y1="392" x2="136" y2="376"/>
    <line x1="392" y1="392" x2="376" y2="376"/>
  </g>

  <!-- Central Emblem: The NOVA Star Interlocking with Acoustic Play Vector -->
  <g transform="translate(256, 256)">
    <!-- 4-Pointed Nova Star Flares -->
    <path d="M 0 -130 Q 0 0 130 0 Q 0 0 0 130 Q 0 0 -130 0 Q 0 0 0 -130 Z" 
          fill="url(#neonPulse)" opacity="0.22" filter="url(#novaGlow)"/>

    <!-- Dynamic Sharp Diamond Rays -->
    <polygon points="0,-105 18,-24 105,0 18,24 0,105 -18,24 -105,0 -18,-24" 
             fill="url(#neonPulse)" opacity="0.85"/>

    <!-- Inner Sleek Music Player Triangle (Play Glyph with Organic Curves) -->
    <path d="M -22 -44 C -22 -48 -17 -51 -13 -48 L 44 -14 C 48 -11 48 -5 44 -2 L -13 32 C -17 35 -22 32 -22 28 Z" 
          fill="#FFFFFF" filter="url(#softGlow)"/>

    <!-- Gold Accent Star Node in Play Crest -->
    <circle cx="2" cy="-8" r="5" fill="url(#goldFire)"/>
    <circle cx="2" cy="-8" r="10" fill="none" stroke="#FDE047" stroke-width="1.5" opacity="0.75"/>
  </g>

  <!-- High-Tech Studio Badge Text: "NOVA" -->
  <text x="256" y="475" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" letter-spacing="8" fill="#E2E8F0" opacity="0.9">NOVA</text>
</svg>`;

async function generate() {
  fs.writeFileSync('./public/icon.svg', svgContent, 'utf-8');
  console.log('Written /public/icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile('./public/icon-192.png');
  console.log('Created icon-192.png');

  // 512x512 PNG (Standard Any icon)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile('./public/icon-512.png');
  console.log('Created icon-512.png');

  // Apple Touch Icon (180x180 PNG with solid background for iOS)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile('./public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');

  // Favicon PNG (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile('./public/favicon.png');
  console.log('Created favicon.png');

  // Logo PNG (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('./public/logo.png');
  console.log('Created logo.png');

  // Maskable Icon for Samsung One UI & Android Home Screen
  // Android requires a safe-zone margin (10-15% padding so circular/squircle crops don't cut the logo)
  await sharp(svgBuffer)
    .resize(380, 380)
    .extend({
      top: 66,
      bottom: 66,
      left: 66,
      right: 66,
      background: { r: 4, g: 5, b: 8, alpha: 1 } // Matches dark cosmic background
    })
    .png({ quality: 100 })
    .toFile('./public/icon-maskable-512.png');
  console.log('Created icon-maskable-512.png with safe-zone margin for Android One UI!');

  console.log('All PWA and mobile launcher icons successfully generated!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
