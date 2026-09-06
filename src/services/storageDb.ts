// IndexedDB persistent storage for NOVA Player local audio files and artwork
import { Track } from '../types';

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
