import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { audioEngine } from './services/audioEngine';
import { ErrorBoundary } from './components/ErrorBoundary';

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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Service Worker registration for PWA installability and background notification handling
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('PWA service worker registration notice:', err);
      });
  });
}
