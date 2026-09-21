import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker safely in production without forcing reload loops
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    registerSW({
      immediate: false,
      onNeedRefresh() {
        console.log('[PWA] Update detected in background.');
      },
      onOfflineReady() {
        console.log('[PWA] Service worker ready.');
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
