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
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'music/file_66',
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'music/file_67',
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'music/file_36.m4a',
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'music/file_37.mp3',
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'music/file_38.m4a',
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA': 'music/file_39.mp3',
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA': 'music/file_40.m4a',
  'CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA': 'music/file_61.m4a',
  'CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ': 'music/file_62.m4a',
  'CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E': 'music/file_33.m4a',
  'CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA': 'music/file_41.m4a',
  'CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA': 'music/file_43.mp3',
  'CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA': 'music/file_44.m4a',
  'CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA': 'music/file_45.mp3',
  'CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA': 'music/file_46.mp3',
  'CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA': 'music/file_63.mp3',
  'CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA': 'music/file_65.m4a',

  // Verified Cover Art Thumbnails
  'AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E': 'thumbnails/file_47.jpg',
  'AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E': 'thumbnails/file_48.jpg',
  'AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA': 'thumbnails/file_49.jpg',
  'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': 'thumbnails/file_50.jpg',
  'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': 'thumbnails/file_51.jpg',
  'AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E': 'thumbnails/file_58.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E': 'thumbnails/file_59.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA': 'thumbnails/file_30.jpg',
  'AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E': 'thumbnails/file_52.jpg',
  'AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E': 'thumbnails/file_54.jpg',
  'AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E': 'thumbnails/file_55.jpg',
  'AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E': 'thumbnails/file_56.jpg',
  'AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E': 'thumbnails/file_57.jpg',
  'AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E': 'thumbnails/file_60.jpg',
  'AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E': 'thumbnails/file_64.jpg'
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
  // Keep valid absolute or local URLs as is
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  // If already pointing to our Express server proxy, keep it (optimal caching, range requests, CORS headers)
  if (url.startsWith('/api/telegram/audio')) {
    return url;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If it's pointing to telegram direct CDN, convert to local proxy to avoid CORS/content-disposition issues
    const fileId = extractFileId(url);
    if (fileId) {
      return `/api/telegram/audio?file_id=${fileId}`;
    }
    return url;
  }
  const fileId = extractFileId(url) || (url.startsWith('CQAC') ? url : null);
  if (fileId) {
    return `/api/telegram/audio?file_id=${fileId}`;
  }
  return url;
}

/**
 * Asynchronous Audio URL Resolver
 * Resolves high-speed streaming audio URL, keeping server proxy for 100% reliable CORS and disk cache playback
 */
export async function resolveAudioStreamUrlAsync(url: string | undefined): Promise<string> {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/api/telegram/audio')) {
    return url;
  }
  const fileId = extractFileId(url) || (url.startsWith('CQAC') ? url : null);
  if (fileId) {
    return `/api/telegram/audio?file_id=${fileId}`;
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

