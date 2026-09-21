/**
 * Direct Telegram Cloud CDN & API Resolution:
 * Enables 100% standalone audio streaming and image rendering across:
 * - Android APK (Capacitor WebView) on physical mobile phones
 * - Web Browser & PWA environments
 * - Localhost development / offline clones
 */

export const DEFAULT_TELEGRAM_BOT_TOKEN = '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
export const DEFAULT_TELEGRAM_CHANNEL_ID = '-1003542494794';

// Pre-verified fast-path mappings for instant startup without network roundtrip
export const DEFAULT_TELEGRAM_PATH_CACHE: Record<string, string> = {
  // Verified Audio Files (Fresh CDN Mapping)
  'CQACAgUAAyEFAATTJi5KAAMEaqBCEBwPUmlyqTcWfoipPLVtC7kAAjc3AAL02QABVW7eevC-lMmhPQQ': 'music/file_70',
  'CQACAgUAAyEFAATTJi5KAAMFaqBCLba3K3viyRgu4Na7ln7vukQAAjg3AAL02QABVQevV5-sQ44CPQQ': 'music/file_71',
  'CQACAgUAAyEFAATTJi5KAAMHaqA-VHWYNBEJ_i_dtgh3LG1RjWQAAsAhAAKZfgFVbci9y_dlFhM9BA': 'music/file_72.m4a',
  'CQACAgUAAyEFAATTJi5KAAMLaqEdV_mpw1IVSY0lKkmjEGXmKNgAAkkiAAKZfglVTyWcug4Tcw09BA': 'music/file_73.mp3',
  'CQACAgUAAyEFAATTJi5KAAMMaqFGvSgVq_6LXDs30BNu8iVQ3R0AAqsiAAKZfglV4rXjZQ0AAd0ePQQ': 'music/file_74.m4a',
  'CQACAgUAAyEFAATTJi5KAAMNaqJrxdBQOWhCzraO4FYFiM1HUisAAmkkAAJ43xhVYlNm0ZoiGFY9BA': 'music/file_75.mp3',
  'CQACAgUAAyEFAATTJi5KAAMOaqMDbAUB0e5k6cBY53pwmcm3BiwAAmMmAAJ43xhVxq0mPZaPE2M9BA': 'music/file_76.m4a',
  'CQACAgUAAyEFAATTJi5KAAMWaqVQiNi6tERj-EPLcypjLCrbFrwAAtMgAAJSFSlVOlDM6c3xj1U9BA': 'music/file_77.m4a',
  'CQACAgUAAyEFAATTJi5KAAMXaqVdbmnRLq_no5gt3551AAF-tzh8AAL_IAACUhUpVV_Toj7i_CxKPQQ': 'music/file_78.m4a',
  'CQACAgUAAyEFAATTJi5KAAMoaqZjza0SgOWhP0ZLPgvjOlIFFwADFSEAAuafMVXIdun-EpLwaz0E': 'music/file_79.m4a',
  'CQACAgUAAyEFAATTJi5KAAMPaqdEbjkP-BkClAG8uhUChRhEYboAAioiAAJ43yBVc65XGg18R5g9BA': 'music/file_80.m4a',
  'CQACAgUAAyEFAATTJi5KAAMRaqdEciBcq_Oi6ITxKHZivW1iJFIAAmYiAAJ43yBVJY3mvGlpvE89BA': 'music/file_81.mp3',
  'CQACAgUAAyEFAATTJi5KAAMSaqdEc68fEiSv-jsP130j9ZTGCuMAAgshAAJSFSFVxnJpxksfpto9BA': 'music/file_82.m4a',
  'CQACAgUAAyEFAATTJi5KAAMUaqdEdKDph_plO7RTOtiXusbUqdoAAlwhAAJSFSFVOggH_w3abN89BA': 'music/file_83.mp3',
  'CQACAgUAAyEFAATTJi5KAAMVaqdEdMsNp8Vug3QuEDGvOLI0dm0AAjQfAAJSFSlVAvE-l__Lo4w9BA': 'music/file_84.mp3',
  'CQACAgUAAyEFAATTJi5KAAMpaqZwvPiQMJL6J98RQ3pt-xzbTtYAAj4iAALmnzlVYvW0CUMSrJU9BA': 'music/file_85.mp3',
  'CQACAgUAAyEFAATTJi5KAAMraqg_Q81zYqQjIIcB8OUFr672NkoAAl4hAAJOMkhVtiQNHA_O3Uo9BA': 'music/file_86.m4a',

  // Real Uploaded Song Picture / Thumbnails
  'AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E': 'thumbnails/file_87.jpg',
  'AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E': 'thumbnails/file_93.jpg',
  'AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA': 'thumbnails/file_88.jpg',
  'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': 'thumbnails/file_91.jpg',
  'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': 'thumbnails/file_92.jpg',
  'AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E': 'thumbnails/file_90.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E': 'thumbnails/file_89.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA': 'thumbnails/file_89.jpg',
  'AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E': 'thumbnails/file_96.jpg',
  'AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E': 'thumbnails/file_97.jpg',
  'AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E': 'thumbnails/file_94.jpg',
  'AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E': 'thumbnails/file_98.jpg',
  'AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E': 'thumbnails/file_95.jpg',
  'AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E': 'thumbnails/file_100.jpg',
  'AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E': 'thumbnails/file_99.jpg'
};

const STORAGE_CACHE_KEY = 'nova_tg_resolved_paths_v4';
let runtimeCache: Record<string, string> = { ...DEFAULT_TELEGRAM_PATH_CACHE };

try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_CACHE_KEY);
    if (saved) {
      runtimeCache = { ...DEFAULT_TELEGRAM_PATH_CACHE, ...JSON.parse(saved) };
    }
  }
} catch {
  // fallback
}

function persistRuntimeCache() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(runtimeCache));
    }
  } catch {
    // ignore
  }
}

export function isRunningInNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const isCapacitor = Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).Capacitor?.getPlatform?.() === 'android' ||
    (window as any).Capacitor?.getPlatform?.() === 'ios' ||
    ((window as any).Capacitor !== undefined && window.location.protocol !== 'http:' && window.location.protocol !== 'https:')
  );
  return (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    isCapacitor
  );
}

export function extractFileId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?&]file_id=([^&]+)/);
  if (match) return decodeURIComponent(match[1]);
  if (url.startsWith('CQAC') || url.startsWith('AAMC')) return url;
  return null;
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
 * In Android APK: Returns direct Telegram CDN URL (or local path) so it plays without backend server!
 * In Web Browser: Uses local /api/telegram/audio proxy when available or direct CDN
 */
export function resolveAudioStreamUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const fileId = extractFileId(url);
  const inNative = isRunningInNativeApp();

  // If in Android APK (Capacitor), direct Telegram CDN stream is 100% required because localhost backend doesn't exist
  if (inNative) {
    if (fileId) {
      const cachedPath = runtimeCache[fileId] || DEFAULT_TELEGRAM_PATH_CACHE[fileId];
      if (cachedPath) {
        return `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${cachedPath}`;
      }
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Fallback if fileId exists
    if (fileId) {
      return `https://api.telegram.org/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`;
    }
    return url;
  }

  // Web Browser environment
  if (url.startsWith('/api/telegram/audio')) {
    if (!url.includes('path=') && fileId) {
      const cachedPath = runtimeCache[fileId] || DEFAULT_TELEGRAM_PATH_CACHE[fileId];
      if (cachedPath) {
        return `${url}&path=${encodeURIComponent(cachedPath)}`;
      }
    }
    return url;
  }
  if (fileId) {
    const cachedPath = runtimeCache[fileId] || DEFAULT_TELEGRAM_PATH_CACHE[fileId];
    if (cachedPath) {
      return `/api/telegram/audio?file_id=${fileId}&path=${encodeURIComponent(cachedPath)}`;
    }
    return `/api/telegram/audio?file_id=${fileId}`;
  }
  return url;
}

/**
 * Asynchronous Audio URL Resolver
 */
export async function resolveAudioStreamUrlAsync(url: string | undefined): Promise<string> {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const fileId = extractFileId(url);
  const inNative = isRunningInNativeApp();

  if (inNative && fileId) {
    const directPath = await resolveTelegramFilePath(fileId);
    if (directPath) {
      return `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${directPath}`;
    }
  }

  return resolveAudioStreamUrl(url);
}

export const DEFAULT_FILE_ID_TO_COVER: Record<string, string> = {
  'AAMCBQADIQUABNMmLkoAAwdqoD5UdZg0EQn-L922CHcsbVGNZAACwCEAApl-AVVtyL3L92UWEwEAB20AAz0E': '/covers/choo-lo.jpg',
  'AAMCBQADIQUABNMmLkoAAwtqoR1X-anDUhVJjSUqSaMQZeYo2AACSSIAApl-CVVPJZy6DhNzDQEAB20AAz0E': '/covers/kaahe-mose.jpg',
  'AAMCBQADIQUABNMmLkoAAwxqoUa9KBWr_otcOzfQE27yJVDdHQACqyIAApl-CVXiteNlDQAB3R4BAAdtAAM9BA': '/covers/raabta.jpg',
  'AAMCBQADIQUABNMmLkoAAw1qomvF0FA5aELOto7gVgWIzUdSKwACaSQAAnjfGFViU2bRmiIYVgEAB20AAz0E': '/covers/somewhere-only-we-know.jpg',
  'AAMCBQADIQUABNMmLkoAAw5qowNsBQHR7mTpwFjnenCZybcGLAACYyYAAnjfGFXGrSY9lo8TYwEAB20AAz0E': '/covers/jo-tum-mere-ho.jpg',
  'AAMCBQADIQUABNMmLkoAAxZqpVCI2Lq0RGP4Q8tzKmMsKtsWvAAC0yAAAlIVKVU6UMzpzfGPVQEAB20AAz0E': '/covers/dil-jhoom.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqp0R5rJybi7fY-8PO0Ojxyt3ILgAC_yAAAlIVKVVf06I-4vwsSgEAB20AAz0E': '/covers/nadaan-parinde.jpg',
  'AAMCBQADIQUABNMmLkoAAxdqpV1uadEur-ejmC3fnnUAAX63OHwAAv8gAAJSFSlVX9OiPuL8LEoBAAdtAAM9BA': '/covers/nadaan-parinde.jpg',
  'AAMCBQADIQUABNMmLkoAAw9qp0RuOQ_4GQKUAby6FQKFGERhugACKiIAAnjfIFVzrlcaDXxHmAEAB20AAz0E': '/covers/surili-akhiyon-wale.jpg',
  'AAMCBQADIQUABNMmLkoAAxFqp0RyIFyr86LohPEodmK9bWIkUgACZiIAAnjfIFUljea8aWm8TwEAB20AAz0E': '/covers/bairan.jpg',
  'AAMCBQADIQUABNMmLkoAAxJqp0Rzrx8SJK_6Ow_XfSP1lMYK4wACCyEAAlIVIVXGcmnGSx-m2gEAB20AAz0E': '/covers/faasle.jpg',
  'AAMCBQADIQUABNMmLkoAAxRqp0R0oOmH-mU7tFM62Je6xtSp2gACXCEAAlIVIVU6CAf_Ddps3wEAB20AAz0E': '/covers/come-and-get-your-love.jpg',
  'AAMCBQADIQUABNMmLkoAAxVqp0R0yw2nxW6DdC4QMa84sjR2bQACNB8AAlIVKVUC8T6X_8ujjAEAB20AAz0E': '/covers/the-last-letter.jpg',
  'AAMCBQADIQUABNMmLkoAAylqpnC8-JAwkvon3xFDem37HNtO1gACPiIAAuafOVVi9bQJQxKslQEAB20AAz0E': '/covers/black-star.jpg',
  'AAMCBQADIQUABNMmLkoAAytqqD9DzXNipCMghwHw5QWvrvY2SgACXiEAAk4ySFW2JA0cD87dSgEAB20AAz0E': '/covers/muntazir.jpg',
};

/**
 * Image / Thumbnail URL Resolver
 * Resolves local cover art paths, Telegram CDN artworks, or external images
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // If pointing to public covers folder (/covers/...)
  if (url.startsWith('/covers/')) {
    return url;
  }

  const fileId = extractFileId(url);
  if (fileId) {
    if (DEFAULT_FILE_ID_TO_COVER[fileId]) {
      return DEFAULT_FILE_ID_TO_COVER[fileId];
    }
    const cachedPath = runtimeCache[fileId] || DEFAULT_TELEGRAM_PATH_CACHE[fileId];
    if (isRunningInNativeApp() && cachedPath) {
      return `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${cachedPath}`;
    }
    if (cachedPath) {
      return `/api/telegram/image?file_id=${fileId}&path=${encodeURIComponent(cachedPath)}`;
    }
    return `/api/telegram/image?file_id=${fileId}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return url;
}
