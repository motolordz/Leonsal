import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const states = ['empty', 'low', 'calm', 'happy', 'excited'];
const records = [
  { id: 'leon', displayName: 'Leon', family: 'guide' },
  { id: 'zaya', displayName: 'Zaya', family: 'guide' },
  { id: 'letter-a', displayName: 'Letter A', family: 'alphabet', uppercase: 'A' },
  { id: 'letter-z', displayName: 'Letter Z', family: 'alphabet', uppercase: 'Z' },
  { id: 'number-1', displayName: 'Number 1', family: 'number' },
  { id: 'number-10', displayName: 'Number 10', family: 'number' },
  { id: 'world-elephant', displayName: 'Elephant', family: 'world' },
  { id: 'world-double-decker-bus', displayName: 'Double-decker Bus', family: 'world' },
  { id: 'world-plane', displayName: 'Plane', family: 'world' },
  { id: 'planet-saturn', displayName: 'Saturn', family: 'planet' }
];

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

try {
  await page.setContent('<!doctype html><html><body><main id="root"></main></body></html>');
  await page.addScriptTag({ path: 'js/v2-character-renderer.js' });
  const result = await page.evaluate(({ records, states }) => {
    const renderer = window.LeonSalCharacterRenderer;
    if (!renderer) return { available: false };
    const output = [];
    for (const record of records) {
      for (const state of states) {
        const svg = renderer.makeCharacter(record, state, { decorative: false });
        output.push({
          id: record.id,
          state,
          exists: Boolean(svg),
          tag: svg?.tagName?.toLowerCase(),
          role: svg?.getAttribute('role'),
          label: svg?.getAttribute('aria-label'),
          classes: svg ? [...svg.classList] : [],
          text: svg?.textContent || '',
          html: svg?.outerHTML || ''
        });
      }
    }
    return { available: true, output };
  }, { records, states });

  assert.equal(result.available, true, 'LeonSalCharacterRenderer is not available');
  for (const item of result.output) {
    assert.equal(item.exists, true, `${item.id} ${item.state} did not render`);
    assert.equal(item.tag, 'svg', `${item.id} ${item.state} did not return SVG`);
    assert.equal(item.role, 'img', `${item.id} ${item.state} missing image role`);
    assert(item.label?.toLowerCase().includes(item.state), `${item.id} ${item.state} missing state in aria label`);
    assert(item.classes.includes(`character-state-${item.state}`) || item.classes.includes(`guide-state-${item.state}`), `${item.id} ${item.state} missing state class`);
    assert(!/source-safe-keeping|qa\/|contact-sheet|rejected|assets\/character-review|_staging/i.test(item.html), `${item.id} ${item.state} referenced blocked art`);
  }

  const byId = new Map(records.map(record => [record.id, result.output.filter(item => item.id === record.id)]));
  for (const [id, items] of byId) {
    assert.equal(items.length, states.length, `${id} did not render all five states`);
    const uniqueMarkup = new Set(items.map(item => item.html));
    assert(uniqueMarkup.size >= 3, `${id} five states are not visually distinct enough`);
  }

  assert(result.output.find(item => item.id === 'leon')?.text.includes('Leon'), 'Leon rendered without visible name');
  assert(result.output.find(item => item.id === 'zaya')?.text.includes('Zaya'), 'Zaya rendered without visible name');
  assert(result.output.find(item => item.id === 'letter-z')?.text.includes('Z'), 'Letter Z rendered without glyph');
  assert(result.output.find(item => item.id === 'number-10')?.text.includes('10'), 'Number 10 rendered without two-digit glyph');
  assert.deepEqual(errors, [], `Renderer browser errors: ${errors.join('\n')}`);
} finally {
  await browser.close();
}

console.log(`V2 character renderer browser checks passed for ${records.length} characters across ${states.length} states.`);
