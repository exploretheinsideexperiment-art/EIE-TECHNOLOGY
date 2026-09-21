import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker in production
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] New version ready, reloading to apply updates...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[PWA] Service worker active and offline cache primed.');
      },
    });
  } catch (err) {
    // Graceful fallback for sandboxed iframes
  }
}

if (typeof window !== 'undefined') {
  (window as any).__eie_mounted = true;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
