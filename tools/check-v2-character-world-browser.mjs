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

for (const value of ['0', '25', '50', '75', '100']) {
  await page.locator('#characterEnergy').evaluate((input, next) => {
    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await page.waitForTimeout(40);
  const state = await page.locator('.selected-character-card svg').getAttribute('class');
  assert(state && state.includes(`character-state-${value === '0' ? 'empty' : value === '25' ? 'low' : value === '50' ? 'calm' : value === '75' ? 'happy' : 'excited'}`), `State class did not update for ${value}`);
}

await page.locator('.character-world-card[data-character="zaya"]').first().click();
assert(await page.locator('.selected-character-card figcaption strong').getByText('Zaya').isVisible(), 'Zaya selection did not render');
await page.getByRole('button', { name: 'A-Z' }).click();
assert(await page.locator('.character-world-card[data-family="alphabet"]').first().isVisible(), 'Alphabet filter did not reveal alphabet characters');
await page.getByRole('button', { name: '1-10' }).click();
assert(await page.locator('.character-world-card[data-family="number"]').first().isVisible(), 'Number filter did not reveal number characters');
await page.locator('#settingsToggle').click();
assert.equal(await page.locator('#settings').getAttribute('data-open'), 'true', 'Settings panel did not open');
await page.keyboard.press('Escape');
assert.equal(await page.locator('#settings').getAttribute('data-open'), 'false', 'Settings panel did not close with Escape');

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
