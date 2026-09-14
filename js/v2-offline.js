'use strict';

(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const status = document.createElement('div');
  status.className = 'connection-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.dataset.online = navigator.onLine ? 'true' : 'false';
  status.textContent = navigator.onLine ? 'Ready for online play.' : 'Offline mode. Saved activities can still open.';
  document.addEventListener('DOMContentLoaded', () => document.body.append(status), { once: true });

  const update = () => {
    status.dataset.online = navigator.onLine ? 'true' : 'false';
    status.textContent = navigator.onLine ? 'Back online.' : 'Offline mode. Saved activities can still open.';
    status.dataset.visible = 'true';
    window.clearTimeout(status.hideTimer);
    status.hideTimer = window.setTimeout(() => {
      if (navigator.onLine) status.dataset.visible = 'false';
    }, 3200);
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if (!navigator.onLine) status.dataset.visible = 'true';

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {
      // Offline support is progressive; registration failure must not block play.
    });
  }, { once: true });
})();
