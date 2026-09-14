import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const html = await fs.readFile('character-review.html', 'utf8');
const js = await fs.readFile('js/character-review.js', 'utf8');
const css = await fs.readFile('character-review.css', 'utf8');
const review = JSON.parse(await fs.readFile('data/character-review.json', 'utf8'));

assert.equal(review.status, 'review-only', 'Character review data must remain review-only');
assert.equal(review.productionApproved, false, 'Character review data must not be production approved');

for (const text of ['productionTruth', 'sourceIntake', 'candidateLibrary', 'reviewSummary', 'data-review-filter="needs-states"', 'data-review-filter="five-state"', 'data-review-filter="guide"', 'data-review-filter="world"']) {
  assert(html.includes(text), `Missing review UI hook: ${text}`);
}

for (const text of ['renderProductionTruth', 'renderSourceIntake', 'renderCandidateLibrary', 'character-assets.json', 'character-readiness-report.json', 'registryGroups', 'matchesFilter', 'statesFor', 'reviewOnly', 'reviewFilter', 'sourceAssets', 'vectorAssets', 'missing.length', 'approved art']) {
  assert(js.includes(text), `Missing review filter implementation: ${text}`);
}

for (const text of ['.production-truth', '.source-intake', '.candidate-library', '.review-summary', '.review-filter-row', 'min-height: 46px']) {
  assert(css.includes(text), `Missing review dashboard styling: ${text}`);
}

const characters = review.characters || [review.character];
assert(characters.length >= 3, 'Expected supplied review characters to remain available');
assert(characters.some(item => item.id === 'leon' && Object.keys(item.states || {}).length < 5), 'Leon missing-state review signal must remain visible');
assert(characters.some(item => item.id === 'zaya' && Object.keys(item.states || {}).length === 5), 'Zaya five-state review set should remain visible');
assert(characters.some(item => item.id === 'elephant' && Object.keys(item.states || {}).length === 5), 'Elephant five-state review set should remain visible');
const suppliedSources = characters.reduce((sum, item) => sum + Object.values(item.states || {}).filter(asset => asset.source).length, 0);
const vectorDerivatives = characters.reduce((sum, item) => sum + Object.values(item.states || {}).filter(asset => asset.vectorSrc).length, 0);
assert.equal(suppliedSources, 14, 'Expected 14 supplied source poses in review intake');
assert.equal(vectorDerivatives, 14, 'Expected 14 review SVG derivatives in review intake');
const readiness = JSON.parse(await fs.readFile('qa/character-production-v3/READINESS/character-readiness-report.json', 'utf8'));
assert.equal(readiness.summary.pendingCharacters, 68, 'Expected 68 pending generated character candidates');
assert.equal(readiness.summary.approvedRuntimeStateAssets, 5, 'Only Battery Buddy should be approved in readiness report');

console.log('Character review static checks passed.');
