import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('v2-home.html', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const js = fs.readFileSync('js/v2-home.js', 'utf8');
const approvedLoader = fs.readFileSync('js/approved-character-image.js', 'utf8');

assert(html.includes('aria-label="Quick play choices"'), 'V2 home must expose quick play choices');
assert(html.includes('aria-label="Show activities"'), 'V2 home must expose activity filtering');
for (const route of [
  'v2-calm-rain-window.html',
  'v2-dash-dock.html',
  'v2-light-trail.html',
  'v2-hold-to-breathe.html',
  'v2-double-decker-bus.html'
]) {
  assert(html.includes(`href="${route}"`), `Quick play missing route: ${route}`);
}
for (const label of ['Quiet', 'Move', 'Draw', 'Breathe', 'Speed']) {
  assert(html.includes(`>${label}</a>`), `Quick play missing label: ${label}`);
}

assert(css.includes('.quick-play'), 'Quick play styling missing');
assert(css.includes('.world-filter'), 'World filter styling missing');
assert(css.includes('min-height: 74px'), 'Quick play desktop touch targets too small or unchecked');
assert(css.includes('min-height: 62px'), 'Quick play mobile touch targets too small or unchecked');
assert(css.includes('scroll-snap-type: x mandatory'), 'Quick play should be swipe-friendly on mobile');
assert(css.includes('overscroll-behavior-x: contain'), 'Mobile choice rows should avoid accidental page gestures');
for (const filter of ['all', 'calm', 'sensory', 'learning', 'world']) {
  assert(html.includes(`data-world-filter="${filter}"`), `Missing world filter: ${filter}`);
}
const categorizedCards = [...html.matchAll(/class="world-game[^"]*" data-world-category="([^"]+)"/g)];
assert.equal(categorizedCards.length, 34, 'Every V2 activity card must have a filter category');
for (const category of ['calm', 'sensory', 'learning', 'world']) {
  assert(categorizedCards.some(([, value]) => value.split(/\s+/).includes(category)), `No cards tagged for ${category}`);
}
for (const text of ['applyWorldFilter', 'data-world-filter', 'data-world-category', 'card.hidden = !visible']) {
  assert(js.includes(text), `V2 home missing filter behavior: ${text}`);
}
for (const text of ['new LeonSalV2.AssetLoaderEngine', 'loader.resolve', 'record?.states?.[state]']) {
  assert(approvedLoader.includes(text), `Approved character loader must use shared asset loader: ${text}`);
}
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet/i.test(html), 'V2 home must not reference review/source/QA art');

console.log('V2 home static checks passed.');
