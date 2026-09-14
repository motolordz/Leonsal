import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const sw = await fs.readFile('sw.js', 'utf8');
const offline = await fs.readFile('js/v2-offline.js', 'utf8');
const home = await fs.readFile('v2-home.html', 'utf8');
const shell = await fs.readFile('js/v2-game-shell.js', 'utf8');

for (const route of [
  'index.html',
  'sensory-lab.html',
  'v2-home.html',
  'v2-energy-battery.html',
  'v2-dash-dock.html',
  'v2-bubble-garden.html',
  'v2-firefly-catch.html',
  'v2-calm-rain-window.html',
  'v2-snow-globe.html',
  'v2-star-shower.html',
  'v2-growing-garden.html',
  'v2-number-merge.html',
  'v2-alphabet-adventure.html',
  'v2-shape-builder.html',
  'v2-letter-tracing.html',
  'v2-number-tracing.html',
  'v2-shape-tracing.html',
  'v2-colour-match.html',
  'v2-big-small.html',
  'v2-pattern-builder.html',
  'v2-sort-it.html',
  'v2-planet-pals.html',
  'v2-build-solar-system.html',
  'v2-day-night.html',
  'v2-light-trail.html',
  'v2-hold-to-breathe.html',
  'v2-trace-engine.html',
  'v2-orbit-engine.html',
  'v2-cause-effect-engine.html',
  'v2-offline.html'
]) {
  assert(sw.includes(route), `Service worker cache is missing ${route}`);
}

for (const asset of [
  'v2-proofs.css',
  'v2-engine.js',
  'js/v2-game-shell.js',
  'js/v2-home.js',
  'js/approved-character-image.js'
]) {
  assert(sw.includes(asset), `Service worker cache is missing ${asset}`);
}

for (const state of ['empty', 'low', 'calm', 'happy', 'excited']) {
  assert(sw.includes(`assets/characters-v2/battery/${state}/web.webp`), `Service worker cache is missing approved Battery ${state} web asset`);
}

const safeAssetsBlock = sw.match(/const SAFE_ASSETS = \[([\s\S]*?)\];/)?.[1] || '';
assert(!/(source-safe-keeping|qa\/|contact-sheet|rejected|character-review|_staging)/i.test(safeAssetsBlock), 'Offline safe cache includes blocked review/source path');
assert(/BLOCKED_PATH/.test(sw), 'Service worker does not define blocked path protection');
assert(/request\.mode === 'navigate'/.test(sw), 'Service worker does not use navigation-only offline fallback');
assert(/v2-offline\.html/.test(sw), 'Service worker does not reference the V2 offline fallback');
assert(/serviceWorker\.register\('sw\.js'/.test(offline), 'V2 home offline helper does not register sw.js');
assert(home.includes('js/v2-offline.js'), 'V2 home does not load offline helper');
assert(/registerOffline/.test(shell), 'V2 game shell does not register offline support for direct game entry');
assert(/connection-status/.test(offline), 'V2 home offline helper does not expose connection status UI');
assert(/connection-status/.test(shell), 'V2 game shell does not expose connection status UI on direct game entry');
assert(/aria-live/.test(offline) && /aria-live/.test(shell), 'Connection status UI is not announced politely');
assert(/window\.addEventListener\('offline'/.test(offline), 'V2 home offline helper does not react to offline events');
assert(/window\.addEventListener\('offline'/.test(shell), 'V2 game shell does not react to offline events');

await fs.mkdir('qa/v2-offline', { recursive: true });
await fs.writeFile('qa/v2-offline/results.json', JSON.stringify({
  passed: true,
  cachedRoutes: 30,
  offlineFallback: 'v2-offline.html',
  connectionStatus: 'polite online/offline status on V2 home and direct game entry',
  cachedApprovedCharacterAssets: 5,
  blockedRuntimePaths: ['source-safe-keeping', 'qa/', 'contact-sheet', 'rejected', 'character-review', '_staging']
}, null, 2) + '\n');

console.log('V2 offline cache checks passed.');
