// IndexedDB persistent storage for NOVA Player local audio files and artwork
import { Track } from '../types';
import { resolveAudioStreamUrl, resolveAudioStreamUrlAsync } from './apiConfig';

const DB_NAME = 'nova_music_player_db';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';
const STORE_AUDIO = 'audio_blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export interface StoredAudioRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  coverArtData?: string; // base64 or stored cover
}

// Save a track and its binary audio blob permanently in IndexedDB
export async function saveTrackWithAudio(track: Track, audioFile: Blob | File, coverData?: string): Promise<void> {
  try {
    const db = await getDB();

    // 1. Save serializable metadata in tracks store
    // Ensure file object is omitted from metadata store
    const { file, ...serializableTrack } = track;
    if (coverData) {
      serializableTrack.coverArt = coverData;
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      store.put(serializableTrack);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // 2. Save binary audio in audio_blobs store
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(STORE_AUDIO);
      const audioRecord: StoredAudioRecord = {
        id: track.id,
        blob: audioFile,
        mimeType: audioFile.type || 'audio/mpeg',
        fileName: track.title,
        coverArtData: coverData,
      };
      store.put(audioRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save track to IndexedDB:', err);
  }
}

// Retrieve audio Blob by track ID
export async function getStoredAudio(trackId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const store = tx.objectStore(STORE_AUDIO);
      const request = store.get(trackId);

      request.onsuccess = () => {
        const record = request.result as StoredAudioRecord | undefined;
        if (record && record.blob) {
          resolve(record.blob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

// Retrieve all stored local tracks
export async function getAllStoredTracks(): Promise<Track[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const request = store.getAll();

      request.onsuccess = () => {
        const tracks = (request.result as Track[]) || [];
        resolve(tracks);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

// Delete a track from both stores
export async function deleteStoredTrack(trackId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_TRACKS, STORE_AUDIO], 'readwrite');
    tx.objectStore(STORE_TRACKS).delete(trackId);
    tx.objectStore(STORE_AUDIO).delete(trackId);
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Error deleting track from DB:', err);
  }
}

// Clear all audio files from DB
export async function clearAllAudioStorage(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_TRACKS, STORE_AUDIO], 'readwrite');
    tx.objectStore(STORE_TRACKS).clear();
    tx.objectStore(STORE_AUDIO).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Error clearing audio storage:', err);
  }
}

// Check if a track has its audio file stored locally in IndexedDB
export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const store = tx.objectStore(STORE_AUDIO);
      const request = store.get(trackId);
      request.onsuccess = () => {
        const record = request.result as StoredAudioRecord | undefined;
        resolve(Boolean(record && record.blob));
      };
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Retrieve set of all track IDs stored offline
export async function getAllDownloadedTrackIds(): Promise<Set<string>> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const store = tx.objectStore(STORE_AUDIO);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = (request.result as string[]) || [];
        resolve(new Set(keys.map(String)));
      };
      request.onerror = () => resolve(new Set());
    });
  } catch {
    return new Set();
  }
}

// Download track audio from URL, save to IndexedDB for offline playing, and trigger device file download
export async function downloadAndSaveTrackOffline(
  track: Track,
  triggerFileSave = true
): Promise<boolean> {
  try {
    let streamUrl = track.audioUrl ? resolveAudioStreamUrl(track.audioUrl) : '';
    if (!streamUrl && track.audioUrl) {
      streamUrl = await resolveAudioStreamUrlAsync(track.audioUrl);
    }
    if (!streamUrl && track.file) {
      streamUrl = URL.createObjectURL(track.file);
    }
    if (!streamUrl) {
      throw new Error('No audio URL available for download');
    }

    const response = await fetch(streamUrl);
    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const blob = await response.blob();

    // 1. Store in IndexedDB
    const ext = track.format || 'mp3';
    const cleanArtist = track.artist.replace(/[/\\?%*:|"<>]/g, '');
    const cleanTitle = track.title.replace(/[/\\?%*:|"<>]/g, '');
    const fileName = `${cleanArtist} - ${cleanTitle}.${ext}`;
    const file = new File([blob], fileName, { type: blob.type || 'audio/mpeg' });
    await saveTrackWithAudio(track, file, track.coverArt);

    // 2. Trigger browser download to device storage if requested
    if (triggerFileSave && typeof document !== 'undefined') {
      try {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          } catch {}
        }, 5000);
      } catch (dlErr) {
        console.warn('Direct device save notice:', dlErr);
      }
    }

    return true;
  } catch (err) {
    console.error('Download offline error for track:', track.title, err);
    return false;
  }
}
