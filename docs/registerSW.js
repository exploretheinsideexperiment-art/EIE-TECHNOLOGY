if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  // Listen for service worker controller change to automatically refresh the page
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => {
          // Immediately check for updates on every page load
          reg.update().catch(() => {});

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update installed; post message to skip waiting
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((err) => {
          // Benign when in sandboxed iframe previews
          console.debug('[PWA] Service Worker registration status:', err?.message || err);
        });
    } catch (e) {
      // Ignore
    }
  });
}
