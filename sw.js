'use strict';

const CACHE_NAME = 'leonsal-v2-safe-cache-v1';
const SAFE_ASSETS = [
  './index.html',
  './sensory-lab.html',
  './v2-home.html',
  './v2-energy-battery.html',
  './v2-dash-dock.html',
  './v2-bubble-garden.html',
  './v2-firefly-catch.html',
  './v2-calm-rain-window.html',
  './v2-snow-globe.html',
  './v2-star-shower.html',
  './v2-growing-garden.html',
  './v2-number-merge.html',
  './v2-alphabet-adventure.html',
  './v2-light-trail.html',
  './v2-hold-to-breathe.html',
  './v2-trace-engine.html',
  './v2-orbit-engine.html',
  './v2-cause-effect-engine.html',
  './v2-offline.html',
  './v2-proofs.css',
  './v2-engine.js',
  './js/v2-game-shell.js',
  './js/v2-home.js',
  './js/approved-character-image.js',
  './data/character-assets.json',
  './assets/characters-v2/battery/empty/web.webp',
  './assets/characters-v2/battery/low/web.webp',
  './assets/characters-v2/battery/calm/web.webp',
  './assets/characters-v2/battery/happy/web.webp',
  './assets/characters-v2/battery/excited/web.webp'
];
const BLOCKED_PATH = /(source-safe-keeping|qa\/|contact-sheet|rejected|character-review|_staging)/i;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SAFE_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || BLOCKED_PATH.test(url.pathname)) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('./v2-offline.html') : undefined)))
  );
});
