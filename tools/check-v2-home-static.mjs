import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('v2-home.html', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const js = fs.readFileSync('js/v2-home.js', 'utf8');
const approvedLoader = fs.readFileSync('js/approved-character-image.js', 'utf8');

assert(html.includes('aria-label="Quick play choices"'), 'V2 home must expose quick play choices');
assert(html.includes('aria-label="Show activities"'), 'V2 home must expose activity filtering');
assert(html.includes('id="hubCharacterStatus"'), 'V2 home must expose character library status');
assert(html.includes('Leon, Zaya and every friend have five energy states.'), 'V2 home character panel must describe the five-state library');
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
for (const text of ['const cardCharacters', 'installCardCharacters', 'renderer.makeCharacter', 'characterDecorated', 'renderCharacterStatus', 'character-assets.json', 'safe vector previews']) {
  assert(js.includes(text), `V2 home missing procedural card character behavior: ${text}`);
}
for (const id of ['elephant', 'plane', 'double-decker', 'letter-a', 'number-3', 'world-cloud', 'planet-earth']) {
  assert(js.includes(`id: '${id}'`), `V2 home card character map missing canonical id: ${id}`);
}
assert(css.includes('.game-art[data-character-decorated="true"] .procedural-character-svg'), 'V2 home card character styling missing');
assert(css.includes('.hub-character-status'), 'V2 home character status styling missing');
assert(rendererLikeVehicle(), 'Shared renderer must classify double-decker as a vehicle');
assert(rendererLikeCharacters(), 'Shared renderer must classify Battery Buddy and Dinosaur as distinct character bodies');
assert(rendererLikeWorldSet(), 'Shared renderer must give core world characters distinct procedural bodies');
assert(rendererLikeObjectSet(), 'Shared renderer must give learning object characters distinct procedural bodies');
assert(rendererLikeTransportSet(), 'Shared renderer must give transport and discovery characters distinct procedural bodies');
assert(rendererLikePlanetSet(), 'Shared renderer must give planet characters distinct procedural bodies');
for (const text of ['new LeonSalV2.AssetLoaderEngine', 'loader.resolve', 'record?.states?.[state]']) {
  assert(approvedLoader.includes(text), `Approved character loader must use shared asset loader: ${text}`);
}
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet/i.test(html), 'V2 home must not reference review/source/QA art');

function rendererLikeVehicle() {
  const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
  const characterWorld = fs.readFileSync('js/v2-character-world.js', 'utf8');
  return /bus\|double-decker/.test(renderer) && /bus\|train\|double-decker/.test(characterWorld);
}

function rendererLikeCharacters() {
  const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
  const characterWorld = fs.readFileSync('js/v2-character-world.js', 'utf8');
  return /battery-body/.test(renderer) && /dinosaur-body/.test(renderer) && /battery-body/.test(characterWorld) && /dinosaur-body/.test(characterWorld);
}

function rendererLikeWorldSet() {
  const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
  return ['sun-body', 'moon-body', 'cloud-body', 'rainbow-body', 'rocket-body', 'tree-body']
    .every(bodyClass => renderer.includes(bodyClass));
}

function rendererLikeObjectSet() {
  const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
  return ['clock-body', 'calendar-body', 'pencil-body', 'book-body', 'paintbrush-body', 'music-body', 'water-body', 'treasure-body']
    .every(bodyClass => renderer.includes(bodyClass));
}

function rendererLikeTransportSet() {
  const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
  return ['earth-body', 'robot-body', 'magnifier-body', 'puzzle-body', 'train-body', 'plane-body', 'boat-body']
    .every(bodyClass => renderer.includes(bodyClass));
}

function rendererLikePlanetSet() {
  const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
  return ['planet-sun-body', 'planet-mercury-body', 'planet-venus-body', 'planet-mars-body', 'planet-jupiter-body', 'planet-saturn-body', 'planet-uranus-body', 'planet-neptune-body']
    .every(bodyClass => renderer.includes(bodyClass));
}

console.log('V2 home static checks passed.');
