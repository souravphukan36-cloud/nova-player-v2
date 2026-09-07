import { Track, AudioFormat } from '../types';
import { extractId3Metadata } from './id3Parser';
import { saveTrackWithAudio } from './storageDb';
import { sanitizeText, sanitizeFilePath, sanitizeMediaUrl } from '../utils/security';

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

  // Base name
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let title = baseName;
  let album = 'Local Music';
  let genre = 'Local Audio';
  let year = new Date(file.lastModified).getFullYear();

  // Extract ID3 tags (embedded APIC photo, singer name, real title, album)
  let extractedCover: string | undefined;
  try {
    const id3 = await extractId3Metadata(file);
    if (id3.title) title = id3.title;
    if (id3.artist) artist = id3.artist;
    if (id3.album) album = id3.album;
    if (id3.genre) genre = id3.genre;
    if (id3.year) year = id3.year;
    if (id3.coverArtUrl) extractedCover = id3.coverArtUrl;
  } catch (e) {
    console.warn('ID3 parsing skipped:', e);
  }

  // Determine duration via temporary audio element
  const duration = await getAudioDuration(file);

  // If no embedded picture, generate an artistic album cover or music poster
  const rawCoverArt = extractedCover || generateGradientFromName(title + artist);
  const coverArt = sanitizeMediaUrl(rawCoverArt) || rawCoverArt;

  const newTrack: Track = {
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title: sanitizeText(title, 120) || 'Untitled Track',
    artist: sanitizeText(artist, 80) || 'Unknown Artist',
    album: sanitizeText(album, 80) || 'Local Music',
    duration: Math.round(duration) || 180,
    format,
    coverArt,
    file,
    folder: sanitizeFilePath(folderPath),
    genre: sanitizeText(genre, 50) || 'Local Audio',
    year: Number.isFinite(year) && year > 1900 && year < 2100 ? year : new Date().getFullYear(),
    bitRate: `${Math.round(file.size / (duration || 180) / 128 * 8)} kbps (${format.toUpperCase()})`,
    playCount: 0,
    isFavorite: false,
    dateAdded: Date.now(),
  };

  // Persist both metadata and actual audio binary into IndexedDB
  try {
    await saveTrackWithAudio(newTrack, file, extractedCover);
  } catch (err) {
    console.warn('Could not save track to IndexedDB:', err);
  }

  return newTrack;
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };

    audio.addEventListener('loadedmetadata', () => {
      const dur = audio.duration;
      cleanup();
      resolve(Number.isFinite(dur) && dur > 0 ? dur : 180);
    });

    audio.addEventListener('error', () => {
      cleanup();
      resolve(180);
    });

    setTimeout(() => {
      cleanup();
      resolve(180);
    }, 2500);
  });
}

function generateGradientFromName(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #1e1e24 0%, #2b1055 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    'linear-gradient(135deg, #232526 0%, #414345 100%)',
    'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
    'linear-gradient(135deg, #4b134f 0%, #c94b4b 100%)',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
