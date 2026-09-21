if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.debug('[PWA] Service Worker registration status:', err?.message || err);
        });
    } catch (e) {
      // Ignore
    }
  });
}
