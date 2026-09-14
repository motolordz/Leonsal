import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const sw = await fs.readFile('sw.js', 'utf8');
const offline = await fs.readFile('js/v2-offline.js', 'utf8');
const home = await fs.readFile('v2-home.html', 'utf8');
const shell = await fs.readFile('js/v2-game-shell.js', 'utf8');

for (const route of [
  'v2-home.html',
  'v2-energy-battery.html',
  'v2-dash-dock.html',
  'v2-bubble-garden.html',
  'v2-light-trail.html',
  'v2-hold-to-breathe.html',
  'v2-trace-engine.html',
  'v2-orbit-engine.html',
  'v2-cause-effect-engine.html'
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
assert(/serviceWorker\.register\('sw\.js'/.test(offline), 'V2 home offline helper does not register sw.js');
assert(home.includes('js/v2-offline.js'), 'V2 home does not load offline helper');
assert(/registerOffline/.test(shell), 'V2 game shell does not register offline support for direct game entry');

await fs.mkdir('qa/v2-offline', { recursive: true });
await fs.writeFile('qa/v2-offline/results.json', JSON.stringify({
  passed: true,
  cachedRoutes: 9,
  cachedApprovedCharacterAssets: 5,
  blockedRuntimePaths: ['source-safe-keeping', 'qa/', 'contact-sheet', 'rejected', 'character-review', '_staging']
}, null, 2) + '\n');

console.log('V2 offline cache checks passed.');
