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
  { id: 'battery-buddy', displayName: 'Battery Buddy', family: 'world' },
  { id: 'world-elephant', displayName: 'Elephant', family: 'world' },
  { id: 'world-dinosaur', displayName: 'Dinosaur', family: 'world' },
  { id: 'world-sun', displayName: 'Sun', family: 'world' },
  { id: 'world-moon', displayName: 'Moon', family: 'world' },
  { id: 'world-cloud', displayName: 'Cloud', family: 'world' },
  { id: 'world-rainbow', displayName: 'Rainbow', family: 'world' },
  { id: 'world-rocket', displayName: 'Rocket', family: 'world' },
  { id: 'world-earth', displayName: 'Earth', family: 'world' },
  { id: 'world-robot', displayName: 'Robot', family: 'world' },
  { id: 'world-magnifier', displayName: 'Magnifying Glass', family: 'world' },
  { id: 'world-puzzle', displayName: 'Puzzle', family: 'world' },
  { id: 'world-train', displayName: 'Train', family: 'world' },
  { id: 'world-plane', displayName: 'Plane', family: 'world' },
  { id: 'world-boat', displayName: 'Boat', family: 'world' },
  { id: 'world-double-decker-bus', displayName: 'Double-decker Bus', family: 'world' },
  { id: 'world-clock', displayName: 'Clock', family: 'world' },
  { id: 'world-calendar', displayName: 'Calendar', family: 'world' },
  { id: 'world-pencil', displayName: 'Pencil', family: 'world' },
  { id: 'world-book', displayName: 'Book', family: 'world' },
  { id: 'world-paintbrush', displayName: 'Paintbrush', family: 'world' },
  { id: 'world-music-note', displayName: 'Music Note', family: 'world' },
  { id: 'world-water', displayName: 'Water Droplet', family: 'world' },
  { id: 'world-treasure', displayName: 'Treasure Chest', family: 'world' },
  { id: 'planet-sun', displayName: 'Sun', family: 'planet' },
  { id: 'planet-mercury', displayName: 'Mercury', family: 'planet' },
  { id: 'planet-venus', displayName: 'Venus', family: 'planet' },
  { id: 'planet-earth', displayName: 'Earth', family: 'planet' },
  { id: 'planet-mars', displayName: 'Mars', family: 'planet' },
  { id: 'planet-jupiter', displayName: 'Jupiter', family: 'planet' },
  { id: 'planet-saturn', displayName: 'Saturn', family: 'planet' },
  { id: 'planet-uranus', displayName: 'Uranus', family: 'planet' },
  { id: 'planet-neptune', displayName: 'Neptune', family: 'planet' },
  { id: 'planet-moon', displayName: 'Moon', family: 'planet' }
];

const expectedBodyClasses = {
  'battery-buddy': 'battery-body',
  'world-elephant': 'elephant-body',
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
  'world-double-decker-bus': 'vehicle-body',
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

  assert(result.output.find(item => item.id === 'leon')?.text.includes('Leon'), 'Leon rendered without visible name');
  assert(result.output.find(item => item.id === 'zaya')?.text.includes('Zaya'), 'Zaya rendered without visible name');
  assert(result.output.find(item => item.id === 'letter-z')?.text.includes('Z'), 'Letter Z rendered without glyph');
  assert(result.output.find(item => item.id === 'number-10')?.text.includes('10'), 'Number 10 rendered without two-digit glyph');
  assert.deepEqual(errors, [], `Renderer browser errors: ${errors.join('\n')}`);
} finally {
  await browser.close();
}

console.log(`V2 character renderer browser checks passed for ${records.length} characters across ${states.length} states.`);
