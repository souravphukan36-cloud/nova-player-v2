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

// Register PWA service worker for mobile installability & PWABuilder
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA service worker registration:', err);
    });
  });
}
