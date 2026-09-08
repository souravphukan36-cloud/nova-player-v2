import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { audioEngine } from './services/audioEngine';

// Global unlock on very first touch or click anywhere on the phone screen
const unlockAudio = () => {
  audioEngine.ensureAudioUnlocked();
  window.removeEventListener('click', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
  window.removeEventListener('touchend', unlockAudio);
};
window.addEventListener('click', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('touchend', unlockAudio, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service Worker handling: only in production to prevent caching Vite dev modules
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration:', err);
      });
    });
  } else {
    // In dev mode, unregister any stale service workers to ensure live preview works smoothly
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
}
