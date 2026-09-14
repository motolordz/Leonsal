import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const states = ['empty', 'low', 'calm', 'happy', 'excited'];
const registry = JSON.parse(fs.readFileSync('data/character-assets.json', 'utf8'));
const registryGroups = ['guides', 'alphabet', 'numbers', 'world', 'planets', 'pilot'];
const rawRecords = registryGroups
  .flatMap(group => (registry[group] || []).map(record => ({
    id: record.id,
    displayName: record.displayName,
    family: record.family === 'numbers' ? 'number' : record.family,
    uppercase: record.uppercase
  })))
  .filter(record => record.id && record.displayName);
rawRecords.push(
  { id: 'world-bus-uk', displayName: 'UK Bus', family: 'world' },
  { id: 'world-bus-hong-kong', displayName: 'Hong Kong Bus', family: 'world' },
  { id: 'world-bus-night', displayName: 'Night Bus', family: 'world' }
);
const byRecordId = new Map();
for (const record of rawRecords) {
  if (!byRecordId.has(record.id)) byRecordId.set(record.id, record);
}
const records = [...byRecordId.values()];

const expectedBodyClasses = {
  'battery-buddy': 'battery-body',
  'world-elephant': 'elephant-body',
  elephant: 'elephant-body',
  'world-dinosaur': 'dinosaur-body',
  'world-sun': 'sun-body',
  'world-moon': 'moon-body',
  'world-cloud': 'cloud-body',
  'world-rainbow': 'rainbow-body',
  'world-rocket': 'rocket-body',
  'world-earth': 'earth-body',
  'world-robot': 'robot-body',
  'world-magnifier': 'magnifier-body',
  'world-puzzle': 'puzzle-body',
  'world-train': 'train-body',
  'world-plane': 'plane-body',
  'world-boat': 'boat-body',
  'world-double-decker-bus': 'double-decker-body',
  'double-decker': 'double-decker-body',
  'world-bus-uk': 'double-decker-body',
  'world-bus-hong-kong': 'double-decker-body',
  'world-bus-night': 'double-decker-body',
  plane: 'plane-body',
  boat: 'boat-body',
  'world-clock': 'clock-body',
  'world-calendar': 'calendar-body',
  'world-pencil': 'pencil-body',
  'world-book': 'book-body',
  'world-paintbrush': 'paintbrush-body',
  'world-music-note': 'music-body',
  'world-water': 'water-body',
  'world-treasure': 'treasure-body',
  'planet-sun': 'planet-sun-body',
  'planet-mercury': 'planet-mercury-body',
  'planet-venus': 'planet-venus-body',
  'planet-earth': 'earth-body',
  'planet-mars': 'planet-mars-body',
  'planet-jupiter': 'planet-jupiter-body',
  'planet-saturn': 'planet-saturn-body',
  'planet-uranus': 'planet-uranus-body',
  'planet-neptune': 'planet-neptune-body',
  'planet-moon': 'moon-body'
};

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
    assert(!/<(?:image|script|foreignObject)\b|data:image|(?:href|xlink:href)\s*=/i.test(item.html), `${item.id} ${item.state} renderer must stay procedural SVG without raster/script references`);
    if (expectedBodyClasses[item.id]) {
      assert(item.html.includes(expectedBodyClasses[item.id]), `${item.id} ${item.state} missing ${expectedBodyClasses[item.id]}`);
    }
  }

  const byId = new Map(records.map(record => [record.id, result.output.filter(item => item.id === record.id)]));
  for (const [id, items] of byId) {
    assert.equal(items.length, states.length, `${id} did not render all five states`);
    const uniqueMarkup = new Set(items.map(item => item.html));
    assert(uniqueMarkup.size >= 3, `${id} five states are not visually distinct enough`);
  }

  assert(result.output.find(item => item.id === 'leon')?.text.includes('LEON'), 'Leon rendered without uppercase visible name');
  assert(result.output.find(item => item.id === 'zaya')?.text.includes('ZAYA'), 'Zaya rendered without uppercase visible name');
  assert(result.output.find(item => item.id === 'leon')?.html.includes('guide-hair-leon'), 'Leon rendered without distinct spiky hair identity');
  assert(result.output.find(item => item.id === 'leon')?.html.includes('guide-accessory-headband'), 'Leon rendered without headband identity');
  assert(result.output.find(item => item.id === 'zaya')?.html.includes('guide-hair-zaya'), 'Zaya rendered without pigtail hair identity');
  assert(result.output.find(item => item.id === 'zaya')?.html.includes('guide-accessory-bows'), 'Zaya rendered without bow identity');
  assert(result.output.find(item => item.id === 'letter-a')?.html.includes('letter-number-body-alphabet'), 'Alphabet characters rendered without alphabet learning body');
  assert(result.output.find(item => item.id === 'letter-a')?.html.includes('learning-family-badge-alphabet'), 'Alphabet characters rendered without ABC family marker');
  assert(result.output.find(item => item.id === 'number-1')?.html.includes('letter-number-body-number'), 'Number characters rendered without number learning body');
  assert(result.output.find(item => item.id === 'number-1')?.html.includes('learning-family-badge-number'), 'Number characters rendered without 123 family marker');
  for (const id of ['leon', 'zaya', 'letter-a', 'battery-buddy', 'double-decker']) {
    const emptyRender = result.output.find(item => item.id === id && item.state === 'empty');
    assert(emptyRender?.html.includes('<ellipse cx="118" cy="138"'), `${id} empty state must use a sleepy open-mouth expression, not a sad curve`);
  }
  assert(result.output.find(item => item.id === 'letter-z')?.text.includes('Z'), 'Letter Z rendered without glyph');
  assert(result.output.find(item => item.id === 'number-10')?.text.includes('10'), 'Number 10 rendered without two-digit glyph');
  assert.deepEqual(errors, [], `Renderer browser errors: ${errors.join('\n')}`);
} finally {
  await browser.close();
}

console.log(`V2 character renderer browser checks passed for ${records.length} characters across ${states.length} states.`);
