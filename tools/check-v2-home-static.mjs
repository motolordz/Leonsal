import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('v2-home.html', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');

assert(html.includes('aria-label="Quick play choices"'), 'V2 home must expose quick play choices');
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
assert(css.includes('min-height: 74px'), 'Quick play desktop touch targets too small or unchecked');
assert(css.includes('min-height: 62px'), 'Quick play mobile touch targets too small or unchecked');
assert(css.includes('scroll-snap-type: x mandatory'), 'Quick play should be swipe-friendly on mobile');
assert(!/assets\/character-review|source-safe-keeping|qa\/|contact-sheet/i.test(html), 'V2 home must not reference review/source/QA art');

console.log('V2 home static checks passed.');
