import { Track } from '../types';
import { resolveImageUrl } from '../services/apiConfig';

interface DynamicPalette {
  primary: string; // Vibrant hex
  glow: string; // rgba with opacity
  gradient: string; // CSS linear gradient
  border: string; // Subtle border color
}

// Pre-defined elegant palettes mapped to genres/moods
const GENRE_PALETTES: Record<string, DynamicPalette> = {
  'Acoustic': {
    primary: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.35)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  'Lo-Fi': {
    primary: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.35)',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #9D174D 100%)',
    border: 'rgba(236, 72, 153, 0.3)'
  },
  'EDM': {
    primary: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.4)',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
    border: 'rgba(139, 92, 246, 0.35)'
  },
  'Pop': {
    primary: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.35)',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)',
    border: 'rgba(6, 182, 212, 0.3)'
  },
  'Rock': {
    primary: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.35)',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)',
    border: 'rgba(239, 68, 68, 0.3)'
  },
  'Assamese': {
    primary: '#10B981',
    glow: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    border: 'rgba(16, 185, 129, 0.3)'
  },
  'Folk': {
    primary: '#EAB308',
    glow: 'rgba(234, 179, 8, 0.35)',
    gradient: 'linear-gradient(135deg, #EAB308 0%, #854D0E 100%)',
    border: 'rgba(234, 179, 8, 0.3)'
  },
  'Ambient': {
    primary: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.35)',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #3730A3 100%)',
    border: 'rgba(99, 102, 241, 0.3)'
  }
};

const DEFAULT_PALETTE: DynamicPalette = {
  primary: '#10B981',
  glow: 'rgba(16, 185, 129, 0.35)',
  gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  border: 'rgba(16, 185, 129, 0.3)'
};

export const DEFAULT_FALLBACK_ART = '/covers/choo-lo.jpg';

export const KNOWN_TRACK_COVERS: Record<string, string> = {
  'tg-anuv-arz-kiya-hai': '/covers/arz-kiya-hai.jpg',
  'tg-local-train-aaoge-tum-kabhi': '/covers/aaoge-tum-kabhi.jpg',
  'tg-local-train-choo-lo': '/covers/choo-lo.jpg',
  'tg-garvit-kaahe-mose': '/covers/kaahe-mose.jpg',
  'tg-pritam-raabta': '/covers/raabta.jpg',
  'tg-keane-somewhere-only-we-know': '/covers/somewhere-only-we-know.jpg',
  'tg-anuv-jo-tum-mere-ho': '/covers/jo-tum-mere-ho.jpg',
};

export function isCoverArtImage(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.startsWith('/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  );
}

export function getTrackCoverArt(track?: Partial<Track> | null): string {
  if (!track) return DEFAULT_FALLBACK_ART;

  if (track.id && KNOWN_TRACK_COVERS[track.id]) {
    return KNOWN_TRACK_COVERS[track.id];
  }

  const title = (track.title || '').toLowerCase();
  if (title.includes('arz kiya') || title.includes('arz')) {
    return '/covers/arz-kiya-hai.jpg';
  }
  if (title.includes('aaoge') || title.includes('kabhi')) {
    return '/covers/aaoge-tum-kabhi.jpg';
  }
  if (title.includes('choo lo') || title.includes('choo')) {
    return '/covers/choo-lo.jpg';
  }
  if (title.includes('kaahe mose') || title.includes('kaahe')) {
    return '/covers/kaahe-mose.jpg';
  }
  if (title.includes('raabta')) {
    return '/covers/raabta.jpg';
  }
  if (title.includes('somewhere only we know') || title.includes('somewhere')) {
    return '/covers/somewhere-only-we-know.jpg';
  }
  if (title.includes('jo tum mere ho')) {
    return '/covers/jo-tum-mere-ho.jpg';
  }

  if (track.coverArt) {
    if (track.coverArt.includes('images.unsplash.com')) {
      // If title matched above, it would have returned. For any other track, check artist
      const artist = (track.artist || '').toLowerCase();
      if (artist.includes('anuv')) return '/covers/anuv-jain-artist.jpg';
      if (artist.includes('local train')) return '/covers/the-local-train-artist.jpg';
    }
    return getResolvedCoverArt(track.coverArt);
  }

  return DEFAULT_FALLBACK_ART;
}

export function getResolvedCoverArt(url?: string | null): string {
  if (!url) return DEFAULT_FALLBACK_ART;
  if (url.startsWith('linear-gradient') || url.startsWith('radial-gradient')) {
    return url;
  }
  // Check for unsplash replacement
  if (url.includes('images.unsplash.com')) {
    if (url.includes('photo-1518709268805-4e9042af9f23')) return '/covers/arz-kiya-hai.jpg';
    if (url.includes('photo-1511671782779-c97d3d27a1d4')) return '/covers/aaoge-tum-kabhi.jpg';
    if (url.includes('photo-1465847899084')) return '/covers/the-local-train-artist.jpg';
  }
  // Check for telegram file_id shortcuts to ensure 100% fast instant local rendering
  if (url.includes('BCEBwPUmly') || url.includes('arz-kiya-hai')) return '/covers/arz-kiya-hai.jpg';
  if (url.includes('BCLba3K3vi') || url.includes('aaoge-tum-kabhi')) return '/covers/aaoge-tum-kabhi.jpg';
  if (url.includes('VHWYNBEJ_i') || url.includes('AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn') || url.includes('choo-lo')) return '/covers/choo-lo.jpg';
  if (url.includes('qEdV_mpw1') || url.includes('AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhV') || url.includes('kaahe-mose')) return '/covers/kaahe-mose.jpg';
  if (url.includes('qFGvSgVq_6') || url.includes('AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_ot') || url.includes('raabta')) return '/covers/raabta.jpg';
  if (url.includes('qJrxdBQOWh') || url.includes('AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aEL') || url.includes('somewhere-only-we-know')) return '/covers/somewhere-only-we-know.jpg';
  if (url.includes('qMDbAUB0e5') || url.includes('AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mT') || url.includes('jo-tum-mere-ho')) return '/covers/jo-tum-mere-ho.jpg';
  if (url.includes('xZqpVCI2Lq0') || url.includes('AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP') || url.includes('dil-jhoom')) return '/covers/1892b4dece2ea307feba67edc4b8ce41.jpg';
  if (url.includes('xdqp0R5rJybi7fY') || url.includes('AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7f') || url.includes('nadaan-parinde')) return '/covers/ae7a3b9620e25a5f35df754a91c5c8d4.jpg';
  if (url.includes('w9qp0RuOQ') || url.includes('AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQK') || url.includes('surili-akhiyon')) return '/covers/3335e41433e97b490ea21118261efcc3.jpg';
  if (url.includes('xFqp0RyIFyr') || url.includes('AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86L') || url.includes('bairan')) return '/covers/5182d03d59464225e0dc50a7c7e61da8.jpg';
  if (url.includes('xJqp0Rzrx8S') || url.includes('AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_') || url.includes('faasle')) return '/covers/5bb81c734ba97a38665516be493c8e72.jpg';
  if (url.includes('xRqp0R0oOmH') || url.includes('AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU') || url.includes('come-and-get-your-love')) return '/covers/04557933087ef9462888e04100c9b5f0.jpg';
  if (url.includes('xVqp0R0yw2n') || url.includes('AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6') || url.includes('last-letter')) return '/covers/aaoge-tum-kabhi.jpg';
  if (url.includes('ylqpnC8-JAw') || url.includes('AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon') || url.includes('black-star')) return '/covers/the-local-train-artist.jpg';
  if (url.includes('ytqqD9DzXNi') || url.includes('AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCM') || url.includes('let-down')) return '/covers/arz-kiya-hai.jpg';
  if (url.includes('Kaise Hua') || url.includes('kaise-hua')) return '/covers/aaoge-tum-kabhi.jpg';

  return resolveImageUrl(url);
}

/**
 * Derives a dynamic, harmonious color palette from a track's coverArt, genre or title
 */
export function getTrackDynamicPalette(track: Track | null): DynamicPalette {
  if (!track) return DEFAULT_PALETTE;

  // 1. Check if coverArt is a CSS gradient with hex colors
  if (track.coverArt && track.coverArt.includes('#')) {
    const hexMatches = track.coverArt.match(/#[0-9A-Fa-f]{6}/g);
    if (hexMatches && hexMatches.length > 0) {
      const primaryHex = hexMatches[0];
      const r = parseInt(primaryHex.slice(1, 3), 16);
      const g = parseInt(primaryHex.slice(3, 5), 16);
      const b = parseInt(primaryHex.slice(5, 7), 16);
      return {
        primary: primaryHex,
        glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
        gradient: track.coverArt,
        border: `rgba(${r}, ${g}, ${b}, 0.35)`
      };
    }
  }

  // 2. Check genre match
  if (track.genre && GENRE_PALETTES[track.genre]) {
    return GENRE_PALETTES[track.genre];
  }

  // 3. Deterministic hash based on title + artist for consistent unique hue
  const str = (track.title + track.artist).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const primary = `hsl(${hue}, 80%, 55%)`;
  const glow = `hsla(${hue}, 85%, 55%, 0.35)`;
  const gradient = `linear-gradient(135deg, hsl(${hue}, 75%, 50%) 0%, hsl(${(hue + 40) % 360}, 80%, 25%) 100%)`;
  const border = `hsla(${hue}, 80%, 55%, 0.35)`;

  return { primary, glow, gradient, border };
}
