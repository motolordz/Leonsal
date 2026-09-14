import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('v2-double-decker-bus.html', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const home = fs.readFileSync('v2-home.html', 'utf8');
const offline = fs.readFileSync('sw.js', 'utf8');
const games = JSON.parse(fs.readFileSync('data/games-v2.json', 'utf8'));

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
  'function effectiveSpeedKey()',
  'dot.dataset.effective',
  'if (!settings.allowsMotion())',
  'setProgress(100)',
  "gameId: 'double-decker-bus-v2'",
  'window.__doubleDeckerBusProofState',
  'hasTapAlternative: true',
  'role="button"',
  'data-speed-dot="super-slow"',
  'bus.addEventListener(\'click\'',
  "event.key === 'Enter' || event.key === ' '",
  'const busDestinations',
  'const busRouteMarks',
  'destination.textContent = busDestinations[selectedBus]',
  'routeMark.textContent = busRouteMarks[selectedBus]',
  'destination: destination?.textContent',
  'routeMark: routeMark?.textContent',
  'id="busJourneyProgress"',
  'role="progressbar"',
  'aria-valuenow',
  'journeyProgress?.setAttribute',
  'progressValue: journeyProgress?.getAttribute',
  'data-stop="start"',
  'data-stop="finish"'
]) {
  assert(html.includes(text), `Double-decker bus missing interaction/sensory contract: ${text}`);
}

for (const selector of ['.bus-choice-row', '.bus-speed-row', '.double-bus', '.bus-landmark', '.bus-city', '.bus-lights', '.speed-ribbon', '.bus-journey-progress', '.bus-destination', '.bus-route-mark', '.bus-side-stripe', '.bus-motion-lines']) {
  assert(css.includes(selector), `Double-decker bus missing visual CSS: ${selector}`);
}
for (const selector of ['.bus-world[data-bus="uk"] .double-bus', '.bus-world[data-bus="hong-kong"] .bus-side-stripe', '.bus-world[data-bus="night"] .bus-route-mark']) {
  assert(css.includes(selector), `Double-decker bus missing bus-specific visual treatment: ${selector}`);
}
assert(css.includes('@media (max-width: 760px)'), 'Double-decker bus must have mobile layout rules');
assert(css.includes('.bus-choice,.bus-speed { min-width: 0; min-height: 48px'), 'Bus choices must keep touch-sized mobile controls');
assert(css.includes('.speed-ribbon i[data-effective="true"]'), 'Bus speed ribbon must show effective calm-capped speed');
assert(css.includes('body[data-calm="true"] .bus-motion-lines'), 'Calm mode must remove bus motion-line animation');
assert(css.includes('.double-bus:focus-visible'), 'Bus tap target must expose keyboard focus');
assert(css.includes('pointer-events: auto; cursor: pointer; touch-action: manipulation'), 'Bus tap target must override decorative layer pointer-events');
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet/i.test(html), 'Bus route must not reference review/source/QA art');
assert(home.includes('v2-double-decker-bus.html'), 'V2 home must link to the double-decker bus route');
assert(offline.includes("'./v2-double-decker-bus.html'"), 'Offline cache must include the double-decker bus route');

const transport = games.games.find((game) => game.id === 30 || game.title === 'Transport Adventure');
const busVariant = transport?.proofVariants?.find((variant) => variant.id === 'double-decker-bus-journey');
assert(busVariant, 'Transport Adventure registry must include the double-decker bus proof variant');
assert.equal(busVariant.route, 'v2-double-decker-bus.html', 'Bus proof variant route must match the implemented route');
assert.deepEqual(busVariant.busTypes, ['uk', 'hong-kong', 'night'], 'Bus proof variant must track the three implemented bus types');
assert.deepEqual(busVariant.speedModes, ['super-slow', 'slow', 'medium', 'fast', 'super-speed'], 'Bus proof variant must track the five implemented speed modes');
assert.equal(busVariant.calmMode, 'caps effective speed at slow', 'Bus registry must preserve calm-mode speed cap');
assert.equal(busVariant.canShipWithProceduralGraphics, true, 'Bus proof must remain playable without final character art');
assert.equal(busVariant.finalCharacterArtRequired, false, 'Bus proof must not depend on unapproved character art');

console.log('V2 double-decker bus static checks passed.');
