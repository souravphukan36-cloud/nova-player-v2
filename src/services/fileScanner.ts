import { Track, AudioFormat } from '../types';

export const SUPPORTED_EXTENSIONS: Record<string, AudioFormat> = {
  mp3: 'mp3',
  wav: 'wav',
  flac: 'flac',
  aac: 'aac',
  ogg: 'ogg',
  m4a: 'm4a',
};

export async function parseAudioFile(file: File, folderPath: string = '/Storage/Music/Imported'): Promise<Track> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  const format: AudioFormat = SUPPORTED_EXTENSIONS[extension] || 'mp3';

  // Basic filename parsing: "Artist - Title.mp3" or just "Title.mp3"
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let title = baseName;

  if (baseName.includes(' - ')) {
    const parts = baseName.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  // Determine duration via temporary audio element
  const duration = await getAudioDuration(file);

  // Generate artistic gradient based on file name hash
  const coverArt = generateGradientFromName(baseName);

  const newTrack: Track = {
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title,
    artist,
    album: 'Local Music',
    duration: Math.round(duration) || 180,
    format,
    coverArt,
    file,
    folder: folderPath,
    genre: 'Local Audio',
    year: new Date(file.lastModified).getFullYear(),
    bitRate: `${Math.round(file.size / (duration || 180) / 128 * 8)} kbps (${format.toUpperCase()})`,
    playCount: 0,
    isFavorite: false,
    dateAdded: Date.now(),
  };

  return newTrack;
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    audio.addEventListener('loadedmetadata', () => {
      const dur = audio.duration;
      cleanup();
      resolve(Number.isFinite(dur) ? dur : 180);
    });

    audio.addEventListener('error', () => {
      cleanup();
      resolve(180);
    });

    // Fallback timeout in case metadata event doesn't fire
    setTimeout(() => {
      cleanup();
      resolve(180);
    }, 2500);
  });
}

function generateGradientFromName(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #0284C7 100%)',
    'linear-gradient(135deg, #7C6EFF 0%, #9333EA 100%)',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
