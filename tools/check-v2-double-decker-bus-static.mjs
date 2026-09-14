import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('v2-double-decker-bus.html', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const home = fs.readFileSync('v2-home.html', 'utf8');
const offline = fs.readFileSync('sw.js', 'utf8');

for (const label of ['UK Bus', 'Hong Kong Bus', 'Night Bus']) {
  assert(html.includes(`>${label}</button>`), `Double-decker bus missing bus type: ${label}`);
}
for (const label of ['Super slow', 'Slow', 'Medium', 'Fast', 'Super speed']) {
  assert(html.includes(`>${label}</button>`), `Double-decker bus missing speed mode: ${label}`);
}
for (const key of ["'super-slow': 10", 'slow: 18', 'medium: 30', 'fast: 48', "'super-speed': 70"]) {
  assert(html.includes(key), `Double-decker bus speed factor not guarded: ${key}`);
}
for (const text of [
  'settings.value.calmMode ? Math.min(base, speedFactors.slow) : base',
  'if (!settings.allowsMotion())',
  'setProgress(100)',
  "gameId: 'double-decker-bus-v2'",
  'window.__doubleDeckerBusProofState',
  'hasTapAlternative: true'
]) {
  assert(html.includes(text), `Double-decker bus missing interaction/sensory contract: ${text}`);
}

for (const selector of ['.bus-choice-row', '.bus-speed-row', '.double-bus', '.bus-landmark', '.bus-city', '.bus-lights']) {
  assert(css.includes(selector), `Double-decker bus missing visual CSS: ${selector}`);
}
assert(css.includes('@media (max-width: 760px)'), 'Double-decker bus must have mobile layout rules');
assert(css.includes('.bus-choice,.bus-speed { min-width: 0; min-height: 48px'), 'Bus choices must keep touch-sized mobile controls');
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet/i.test(html), 'Bus route must not reference review/source/QA art');
assert(home.includes('v2-double-decker-bus.html'), 'V2 home must link to the double-decker bus route');
assert(offline.includes("'./v2-double-decker-bus.html'"), 'Offline cache must include the double-decker bus route');

console.log('V2 double-decker bus static checks passed.');
