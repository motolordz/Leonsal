import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const html = await fs.readFile('character-review.html', 'utf8');
const js = await fs.readFile('js/character-review.js', 'utf8');
const css = await fs.readFile('character-review.css', 'utf8');
const review = JSON.parse(await fs.readFile('data/character-review.json', 'utf8'));

assert.equal(review.status, 'review-only', 'Character review data must remain review-only');
assert.equal(review.productionApproved, false, 'Character review data must not be production approved');

for (const text of ['productionTruth', 'reviewSummary', 'data-review-filter="needs-states"', 'data-review-filter="five-state"', 'data-review-filter="guide"', 'data-review-filter="world"']) {
  assert(html.includes(text), `Missing review UI hook: ${text}`);
}

for (const text of ['renderProductionTruth', 'character-assets.json', 'registryGroups', 'matchesFilter', 'statesFor', 'reviewOnly', 'reviewFilter']) {
  assert(js.includes(text), `Missing review filter implementation: ${text}`);
}

for (const text of ['.production-truth', '.review-summary', '.review-filter-row', 'min-height: 46px']) {
  assert(css.includes(text), `Missing review dashboard styling: ${text}`);
}

const characters = review.characters || [review.character];
assert(characters.length >= 3, 'Expected supplied review characters to remain available');
assert(characters.some(item => item.id === 'leon' && Object.keys(item.states || {}).length < 5), 'Leon missing-state review signal must remain visible');
assert(characters.some(item => item.id === 'zaya' && Object.keys(item.states || {}).length === 5), 'Zaya five-state review set should remain visible');
assert(characters.some(item => item.id === 'elephant' && Object.keys(item.states || {}).length === 5), 'Elephant five-state review set should remain visible');

console.log('Character review static checks passed.');
