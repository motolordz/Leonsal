import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const file = path.resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
  try {
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});

const externalBase = process.env.LEONSAL_BASE_URL?.replace(/\/$/, '');
if (!externalBase) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = externalBase || `http://127.0.0.1:${server.address().port}`;
const registry = JSON.parse(await fs.readFile('data/character-assets.json', 'utf8'));
const registryRecords = [];
for (const group of ['guides', 'alphabet', 'numbers', 'world', 'planets', 'pilot']) {
  for (const record of registry[group] || []) {
    if (registryRecords.some(item => item.id === record.id)) continue;
    registryRecords.push({ ...record, family: record.family === 'numbers' ? 'number' : record.family });
  }
}
const approvedCharacters = registryRecords.filter(record => record.status === 'approved').length;
const pendingCharacters = registryRecords.length - approvedCharacters;
const browser = await chromium.launch();
const out = 'qa/v2-home-hub';
await fs.mkdir(out, { recursive: true });
const errors = [];

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 900 }, { width: 1280, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto(`${base}/v2-home.html`);
    await page.waitForSelector('.hub-welcome');
    assert(await page.getByRole('heading', { name: /choose a calm world and start playing/i }).isVisible());
    assert.equal(await page.getByRole('link', { name: 'Ride the bus' }).getAttribute('href'), 'v2-double-decker-bus.html');
    assert.equal(await page.locator('.world-map-card').count(), 5);
    assert.equal(await page.locator('.quick-play a').count(), 5);
    for (const name of ['Quiet', 'Move', 'Draw', 'Breathe', 'Speed']) {
      assert(await page.locator('.quick-play a').filter({ hasText: name }).isVisible(), `Missing quick play choice: ${name}`);
    }
    for (const name of ['Sensory & Regulation', 'Maths & Logic', 'Literacy', 'Time, World & Life', 'Characters & Rewards']) {
      assert(await page.locator('.world-map-card').filter({ hasText: name }).isVisible(), `Missing world card: ${name}`);
    }
    assert.equal(await page.locator('.hub-game-grid .world-game').count(), 10);
    assert.equal(await page.locator('.hub-engine-grid .world-game').count(), 24);
    assert.equal(await page.locator('.need-card').count(), 5);
    assert.equal(await page.locator('.bus-need').getAttribute('href'), 'v2-double-decker-bus.html');
    assert(await page.locator('.bus-need').getByText('I want speed choices', { exact: true }).isVisible());
    const characterStatus = (await page.locator('#hubCharacterStatus').innerText()).replace(/\s+/g, ' ');
    assert(characterStatus.includes(`${approvedCharacters} approved art set`), 'Hub character status must keep approved count honest');
    assert(characterStatus.includes(`${pendingCharacters} safe vector previews`), 'Hub character status must keep pending vector count honest');
    for (const expected of ['2 Leon & Zaya', '26 A-Z', '10 1-10', '25 World', '10 Planets']) {
      assert(characterStatus.includes(expected), `Hub character status missing ${expected}`);
    }
    assert.equal(await page.locator('.hub-game-grid').getAttribute('aria-label'), 'Sensory activity carousel');
    assert.equal(await page.locator('.hub-engine-grid').getAttribute('aria-label'), 'Learning activity carousel');
    assert.equal(await page.locator('.hub-game-grid').getAttribute('tabindex'), '0');
    assert.equal(await page.locator('.hub-engine-grid').getAttribute('tabindex'), '0');
    if (viewport.width <= 620) {
      assert.equal(await page.locator('.hub-game-grid').evaluate(element => getComputedStyle(element).display), 'flex');
      assert.equal(await page.locator('.hub-engine-grid').evaluate(element => getComputedStyle(element).display), 'flex');
      assert(await page.locator('.hub-engine-grid').evaluate(element => element.scrollWidth > element.clientWidth), 'Learning activity carousel should be horizontally scrollable on phone');
    }
    assert(await page.getByRole('link', { name: /open character world/i }).isVisible());
    assert(await page.getByRole('link', { name: /internal art review/i }).isVisible());
    await page.getByRole('button', { name: 'Settings' }).click();
    assert.equal(await page.locator('#hubSettings').getAttribute('data-open'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#hubSettings').getAttribute('data-open'), 'false');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    assert(!requests.some(url => /assets\/character-review|source-safe-keeping|qa\/|contact-sheet/i.test(url)), 'Review/source art leaked into V2 home');
    await page.screenshot({ path: `${out}/v2-home-${viewport.width}.png`, fullPage: true });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${out}/results.json`, JSON.stringify({ passed: true, viewports: [390, 768, 1280], checks: ['hub loaded', 'five world cards', 'ten sensory games', 'twenty-four learning engine cards', 'keyboard-focusable mobile carousels', 'settings popover', 'no horizontal overflow', 'no review-art requests'], errors }, null, 2) + '\n');
  console.log('V2 home hub checks passed');
} finally {
  await browser.close();
  if (!externalBase) await new Promise(resolve => server.close(resolve));
}
