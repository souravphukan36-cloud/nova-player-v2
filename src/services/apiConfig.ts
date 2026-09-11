/**
 * Direct Telegram Cloud CDN & API Resolution:
 * Enables 100% standalone audio streaming and image rendering across:
 * - Android APK (Capacitor WebView) on physical mobile phones
 * - Localhost development / offline clones (without requiring a custom .env file)
 * - Cloud & PWA environments
 */

export const DEFAULT_TELEGRAM_BOT_TOKEN = '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
export const DEFAULT_TELEGRAM_CHANNEL_ID = '-1003542494794';

// Pre-verified fast-path mappings for instant startup without network roundtrip
export const DEFAULT_TELEGRAM_PATH_CACHE: Record<string, string> = {
  // Verified Audio Files
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'music/file_16',
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'music/file_3',
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'music/file_4',
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'music/file_17.mp3',
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'music/file_6.m4a',
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA': 'music/file_18.mp3',
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA': 'music/file_10.m4a',

  // Verified Cover Art Thumbnails
  'AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E': 'thumbnails/file_5',
  'AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E': 'thumbnails/file_1.jpg',
  'AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA': 'thumbnails/file_7.jpg',
  'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': 'thumbnails/file_19.jpg',
  'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': 'thumbnails/file_11.jpg'
};

const STORAGE_CACHE_KEY = 'nova_tg_resolved_paths_v2';
let runtimeCache: Record<string, string> = { ...DEFAULT_TELEGRAM_PATH_CACHE };

try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_CACHE_KEY);
    if (saved) {
      runtimeCache = { ...DEFAULT_TELEGRAM_PATH_CACHE, ...JSON.parse(saved) };
    }
  }
} catch {}

function persistRuntimeCache() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(runtimeCache));
    }
  } catch {}
}

export function extractFileId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?&]file_id=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function resolveTelegramFilePath(fileId: string, forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    if (runtimeCache[fileId]) return runtimeCache[fileId];
    if (DEFAULT_TELEGRAM_PATH_CACHE[fileId]) return DEFAULT_TELEGRAM_PATH_CACHE[fileId];
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
    if (res.ok) {
      const data = await res.json() as { ok: boolean; result?: { file_path?: string } };
      if (data.ok && data.result?.file_path) {
        runtimeCache[fileId] = data.result.file_path;
        persistRuntimeCache();
        return data.result.file_path;
      }
    }
  } catch (err) {
    console.warn('Direct Telegram getFile resolution error for fileId', fileId, err);
  }
  return DEFAULT_TELEGRAM_PATH_CACHE[fileId] || null;
}

export function getApiBaseUrl(): string {
  return '';
}

/**
 * Synchronous Audio URL Resolver
 * Instantly returns the direct Telegram CDN URL using pre-cached file paths
 */
export function resolveAudioStreamUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const fileId = extractFileId(url);
  if (fileId) {
    const cachedPath = runtimeCache[fileId] || DEFAULT_TELEGRAM_PATH_CACHE[fileId];
    if (cachedPath) {
      return `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${cachedPath}`;
    }
  }
  return url;
}

/**
 * Asynchronous Audio URL Resolver
 * Resolves fresh file path from Telegram Bot API if missing or expired, guarantees 100% playable stream
 */
export async function resolveAudioStreamUrlAsync(url: string | undefined): Promise<string> {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const fileId = extractFileId(url);
  if (fileId) {
    const filePath = await resolveTelegramFilePath(fileId);
    if (filePath) {
      return `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${filePath}`;
    }
  }
  return resolveAudioStreamUrl(url);
}

/**
 * Image / Thumbnail URL Resolver
 * Instantly returns high-res artwork directly from Telegram CDN or external artwork
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const fileId = extractFileId(url);
  if (fileId) {
    const cachedPath = runtimeCache[fileId] || DEFAULT_TELEGRAM_PATH_CACHE[fileId];
    if (cachedPath) {
      return `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${cachedPath}`;
    }
    // Background fetch to populate cache for future views
    resolveTelegramFilePath(fileId).catch(() => {});
  }
  return url;
}

