import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.LEONSAL_BASE_URL || 'http://127.0.0.1:4179';
const out = 'qa/v2-character-world';
await fs.mkdir(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'block'
});
const page = await context.newPage();
const requests = [];
const errors = [];
page.on('request', request => requests.push(request.url()));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

await page.goto(`${base}/v2-character-world.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('.character-world-card');
await page.screenshot({ path: `${out}/character-world-390.png`, fullPage: true });

const cardCount = await page.locator('.character-world-card').count();
assert(cardCount >= 60, `Expected broad character library, found ${cardCount}`);
assert(await page.getByRole('heading', { name: 'Character World' }).isVisible(), 'Heading missing');
assert(await page.locator('[data-chase-character="leon"] svg').isVisible(), 'Leon procedural runner missing');
assert(await page.locator('[data-chase-character="zaya"] svg').isVisible(), 'Zaya procedural runner missing');
assert.equal(await page.locator('.character-runway-state').count(), 5, 'Selected character runway must render five states');
assert.equal(await page.locator('.character-world-card[data-status="approved"]').count(), 1, 'Only Battery Buddy should appear as approved artwork');
assert.equal(await page.locator('.character-world-card[data-status="pending"]').count(), cardCount - 1, 'All non-Battery characters should remain pending vector fallbacks');

for (const value of ['0', '25', '50', '75', '100']) {
  await page.locator('#characterEnergy').evaluate((input, next) => {
    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await page.waitForTimeout(40);
  const state = await page.locator('.selected-character-card svg').getAttribute('class');
  assert(state && state.includes(`character-state-${value === '0' ? 'empty' : value === '25' ? 'low' : value === '50' ? 'calm' : value === '75' ? 'happy' : 'excited'}`), `State class did not update for ${value}`);
  assert.equal(await page.locator(`.character-runway-state[aria-pressed="true"] strong`).innerText(), `${value}%`, `Runway active state did not track ${value}`);
}

async function assertSelectedFiveStates(characterId, displayName, expectedBodyClass) {
  await page.locator(`.character-world-card[data-character="${characterId}"]`).first().click();
  assert(await page.locator('.selected-character-card figcaption strong').getByText(displayName, { exact: true }).isVisible(), `${displayName} selection did not render`);
  const expectedStates = [
    ['0', 'empty'],
    ['25', 'low'],
    ['50', 'calm'],
    ['75', 'happy'],
    ['100', 'excited']
  ];
  for (const [value, state] of expectedStates) {
    await page.locator('#characterEnergy').evaluate((input, next) => {
      input.value = next;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    await page.waitForTimeout(40);
    const selectedSvg = page.locator('.selected-character-card svg').first();
    const className = await selectedSvg.getAttribute('class');
    assert(className && className.includes(`character-state-${state}`), `${displayName} did not render ${state} state`);
    if (expectedBodyClass === 'home-guide-svg') {
      assert(className.includes(expectedBodyClass), `${displayName} ${state} missing ${expectedBodyClass}`);
    } else {
      assert.equal(await page.locator(`.selected-character-card .${expectedBodyClass}`).count(), 1, `${displayName} ${state} missing ${expectedBodyClass}`);
    }
    assert(await page.locator('.selected-character-card figcaption strong').getByText(displayName, { exact: true }).isVisible(), `${displayName} did not remain selected at ${state}`);
  }
  await page.locator('.character-runway-state[data-state="empty"]').click();
  assert.equal(await page.locator('#characterEnergy').inputValue(), '0', `${displayName} runway empty state did not set energy`);
  assert(await page.locator('.selected-character-card figcaption strong').getByText(displayName, { exact: true }).isVisible(), `${displayName} changed identity after runway click`);
  await page.locator('.character-runway-state[data-state="excited"]').click();
  assert.equal(await page.locator('#characterEnergy').inputValue(), '100', `${displayName} runway excited state did not set energy`);
}

await assertSelectedFiveStates('zaya', 'Zaya', 'home-guide-svg');
await page.getByRole('button', { name: 'A-Z' }).click();
assert(await page.locator('.character-world-card[data-family="alphabet"]').first().isVisible(), 'Alphabet filter did not reveal alphabet characters');
await assertSelectedFiveStates('letter-z', 'Letter Z', 'letter-number-body');
await page.getByRole('button', { name: '1-10' }).click();
assert(await page.locator('.character-world-card[data-family="number"]').first().isVisible(), 'Number filter did not reveal number characters');
await assertSelectedFiveStates('number-10', 'Number 10', 'letter-number-body');
await page.getByRole('button', { name: 'World' }).click();
await assertSelectedFiveStates('world-dinosaur', 'Dinosaur', 'dinosaur-body');
await page.getByRole('button', { name: 'Planets' }).click();
await assertSelectedFiveStates('planet-saturn', 'Saturn', 'planet-saturn-body');
await page.getByRole('button', { name: 'All', exact: true }).click();
await page.getByRole('button', { name: 'Approved only', exact: true }).click();
assert.equal(await page.locator('.character-world-card').count(), 1, 'Approved-only filter should show one approved character');
assert(await page.locator('.character-world-card[data-character="battery-buddy"]').isVisible(), 'Approved-only filter should show Battery Buddy');
await page.getByRole('button', { name: 'Pending vectors', exact: true }).click();
assert.equal(await page.locator('.character-world-card[data-status="approved"]').count(), 0, 'Pending filter must hide approved Battery Buddy');
assert(await page.locator('.character-world-card[data-character="leon"]').isVisible(), 'Pending filter should show Leon procedural vector fallback');
await page.locator('.character-world-card[data-character="leon"]').first().click();
assert(await page.locator('.selected-character-card figcaption strong').getByText('Leon', { exact: true }).isVisible(), 'Pending status filter changed selected character identity');
await page.getByRole('button', { name: 'A-Z' }).click();
await page.getByRole('button', { name: 'Approved only', exact: true }).click();
assert(await page.locator('.character-world-empty').getByText('No approved art here yet.', { exact: true }).isVisible(), 'Empty approved-family state did not explain missing approved art');
await page.getByRole('button', { name: 'Show all artwork', exact: true }).click();
assert(await page.locator('.character-world-card[data-family="alphabet"]').first().isVisible(), 'Show all artwork did not restore alphabet vector cards');
await page.locator('#settingsToggle').click();
assert.equal(await page.locator('#settings').getAttribute('data-open'), 'true', 'Settings panel did not open');
await page.keyboard.press('Escape');
assert.equal(await page.locator('#settings').getAttribute('data-open'), 'false', 'Settings panel did not close with Escape');
assert(await page.getByRole('button', { name: 'Pause', exact: true }).isVisible(), 'Character World missing shared Pause control');
assert(await page.getByRole('button', { name: 'Finished', exact: true }).isVisible(), 'Character World missing shared Finished control');
await page.getByRole('button', { name: 'Pause', exact: true }).click();
assert.equal(await page.locator('body').getAttribute('data-paused'), 'true', 'Character World Pause did not pause the shared shell');
await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
assert.equal(await page.locator('body').getAttribute('data-paused'), 'false', 'Character World Keep playing did not resume the shared shell');
await page.locator('.character-runway-state[data-state="excited"]').click();
await page.getByRole('button', { name: 'Finished', exact: true }).click();
assert(await page.getByText('All done for now', { exact: true }).isVisible(), 'Character World Finished did not show the shared completion dialog');
const progressAfterFinished = await page.evaluate(() => JSON.parse(localStorage.getItem('leonsal-v2-profile-progress') || '{}'));
assert.equal(progressAfterFinished.progress?.['character-world']?.visits, 1, 'Character World did not record a local visit');
assert(progressAfterFinished.finished?.includes('character-world'), 'Character World did not record Finished locally');
await page.getByRole('button', { name: 'Start again', exact: true }).click();
assert.equal(await page.locator('#characterEnergy').inputValue(), '50', 'Character World Start again did not reset energy');
assert(await page.locator('.selected-character-card figcaption strong').getByText('Leon', { exact: true }).isVisible(), 'Character World Start again did not reset selected character to Leon');
for (const mode of ['Football', 'Hoops', 'Calm', 'Chase']) {
  await page.locator('.play-mode-picker').getByRole('button', { name: mode, exact: true }).click();
  assert.equal(await page.locator('.character-chase-scene').getAttribute('data-play-mode'), mode.toLowerCase(), `${mode} play mode did not activate`);
}

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.character-world-card');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
assert.equal(overflow, false, 'Character World has horizontal overflow at 390px');

const blocked = requests.filter(url => /source-safe-keeping|qa\/|contact-sheet|rejected|assets\/character-review|_staging/i.test(url));
assert.deepEqual(blocked, [], `Blocked art path requested: ${blocked.join(', ')}`);
assert.deepEqual(errors, [], `Console/page errors: ${errors.join('\n')}`);

await fs.writeFile(`${out}/results.json`, JSON.stringify({
  passed: true,
  viewport: '390x844',
  cardCount,
  checks: ['five-state range', 'Leon and Zaya procedural runners', 'family filters', 'settings open-close', 'reduced-motion reload', 'no blocked art requests', 'no horizontal overflow'],
  blockedRequests: blocked,
  errors
}, null, 2) + '\n');

await browser.close();
console.log(`V2 Character World browser checks passed with ${cardCount} cards.`);
