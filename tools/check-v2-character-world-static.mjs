import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('v2-character-world.html', 'utf8');
const js = fs.readFileSync('js/v2-character-world.js', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const home = fs.readFileSync('v2-home.html', 'utf8');
const landing = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

assert(html.includes('Character World'), 'Character World route title missing');
assert(html.includes('class="game-scene character-world-hero"'), 'Character World must use shared game scene shell');
assert(html.includes('id="settingsToggle"'), 'Character World must expose shared settings toggle');
assert(html.includes('id="settings"'), 'Character World must expose shared settings panel');
assert(html.includes('id="characterRuntimeTruth"'), 'Character World must expose runtime art truth');
assert(html.includes('id="characterStateRunway"'), 'Character World must expose five-state runway');
assert(html.includes('js/v2-character-renderer.js'), 'Character World shared renderer script missing');
assert(html.includes('js/v2-character-world.js'), 'Character World script missing');
assert(home.includes('href="v2-character-world.html"'), 'V2 home must link child-facing Character World');
assert(landing.includes('href="v2-character-world.html"'), 'Landing page must link child-facing Character World');
assert(sw.includes("'./v2-character-world.html'"), 'Offline cache must include Character World route');
assert(sw.includes("'./js/v2-character-world.js'"), 'Offline cache must include Character World script');

for (const family of ['guide', 'alphabet', 'number', 'world', 'planet']) {
  assert(html.includes(`data-family-filter="${family}"`), `Missing family filter: ${family}`);
}
for (const status of ['all', 'approved', 'pending']) {
  assert(html.includes(`data-status-filter="${status}"`), `Missing artwork status filter: ${status}`);
}
for (const mode of ['chase', 'football', 'hoops', 'calm']) {
  assert(html.includes(`data-play-mode="${mode}"`), `Missing play mode: ${mode}`);
}
for (const state of ['empty', 'low', 'calm', 'happy', 'excited']) {
  assert(js.includes(`['${state}'`), `Missing state anchor: ${state}`);
}
for (const text of [
  'fetch(\'data/character-assets.json\')',
  'renderRuntimeTruth',
  'approved runtime states',
  'LeonSalCharacterRenderer',
  'makeCharacter(record, state',
  'makeSvg(record, state',
  'renderStateRunway',
  'character-runway-state',
  'statusFilter',
  'data-status',
  'Procedural vector fallback',
  'new LeonSalGameShell',
  'new LeonSalV2.SettingsPanel'
]) {
  assert(js.includes(text), `Character World missing behavior: ${text}`);
}

assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet|rejected/i.test(html), 'Character World HTML must not reference blocked art paths');
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet|rejected/i.test(js), 'Character World JS must not reference blocked art paths');
assert(css.includes('.character-world-grid'), 'Character World grid styling missing');
assert(css.includes('.character-status-tabs'), 'Character World status filter styling missing');
assert(css.includes('.character-runtime-truth'), 'Runtime truth styling missing');
assert(css.includes('.character-state-runway'), 'Five-state runway styling missing');
assert(css.includes('.character-runway-state'), 'Five-state runway state styling missing');
assert(css.includes('scroll-snap-type: x mandatory'), 'Mobile runway must scroll predictably');
assert(css.includes('@keyframes characterChaseLeon'), 'Leon chase animation missing');
assert(css.includes('@keyframes footballDribble'), 'Football play animation missing');
assert(css.includes('@keyframes hoopsArc'), 'Hoop play animation missing');
assert(css.includes('body[data-motion="off"] .chase-player'), 'Reduced motion guard missing');
assert(css.includes('min-height: 52px'), 'Family tabs must keep touch targets large');

console.log('V2 Character World static checks passed.');
