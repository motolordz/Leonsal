import assert from 'node:assert/strict';
import fs from 'node:fs';

const landing = fs.readFileSync('index.html', 'utf8');
const home = fs.readFileSync('v2-home.html', 'utf8');
const renderer = fs.readFileSync('js/v2-character-renderer.js', 'utf8');
const js = fs.readFileSync('js/v2-home-characters.js', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

for (const source of [landing, home]) {
  assert(source.includes('js/v2-character-renderer.js'), 'Shared character renderer script missing from route');
  assert(source.includes('js/v2-home-characters.js'), 'Home character script missing from route');
  assert(source.includes('data-home-guide="leon"'), 'Leon procedural home guide missing');
  assert(source.includes('data-home-guide="zaya"'), 'Zaya procedural home guide missing');
  assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet|rejected/i.test(source), 'Home route must not reference blocked character art paths');
}

for (const text of ['LeonSalCharacterRenderer', 'makeCharacter', 'makeGuide', 'Leon', 'Zaya', 'supportedGuideStates']) {
  assert(renderer.includes(text), `Shared guide renderer missing: ${text}`);
}
for (const state of ['empty', 'low', 'calm', 'happy', 'excited']) {
  assert(renderer.includes(state), `Shared guide renderer missing state: ${state}`);
}
for (const text of ['makeCharacter', 'LeonSalCharacterRenderer', 'data-svg-guide', 'home-guide-svg']) {
  assert(js.includes(text), `Home procedural guide renderer missing: ${text}`);
}
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet|rejected/i.test(renderer), 'Shared guide renderer must not reference blocked art paths');
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet|rejected/i.test(js), 'Home procedural guide renderer must not reference blocked art paths');
assert(css.includes('.landing-runner[data-svg-guide="true"]'), 'Home procedural guide CSS missing');
assert(sw.includes("'./js/v2-character-renderer.js'"), 'Offline cache must include shared character renderer script');
assert(sw.includes("'./js/v2-home-characters.js'"), 'Offline cache must include home procedural character script');

console.log('V2 home procedural character static checks passed.');
