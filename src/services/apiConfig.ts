/**
 * Dynamic API Base URL resolution:
 * - When running in browser / PWA / dev server: uses relative path '' so requests go to current origin.
 * - When running inside Capacitor Android APK: uses the live Cloud Server backend URL.
 */
const CLOUD_BACKEND_ORIGIN = 'https://ais-dev-fbhban2e5wt3mdzpzgznj3-920461303128.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // If running inside Capacitor APK on Android (capacitor://localhost or https://localhost)
    if (origin.includes('localhost') && (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
      return CLOUD_BACKEND_ORIGIN;
    }
    // If bundled into native Webview without dev server
    if (origin.startsWith('capacitor://') || origin.startsWith('file://')) {
      return CLOUD_BACKEND_ORIGIN;
    }
  }
  return '';
}

export function resolveAudioStreamUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const base = getApiBaseUrl();
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
