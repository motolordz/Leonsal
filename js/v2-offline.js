'use strict';

(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {
      // Offline support is progressive; registration failure must not block play.
    });
  }, { once: true });
})();
