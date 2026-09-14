import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-landing-page';
const externalBase = process.env.LEONSAL_BASE_URL?.replace(/\/$/, '');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const file = path.resolve(root, `.${url.pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) return response.writeHead(403).end();
  try {
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await fs.mkdir(out, { recursive: true });
if (!externalBase) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
}

const browser = await chromium.launch();
const base = externalBase || `http://127.0.0.1:${server.address().port}`;
const errors = [];
const forbiddenRequests = [];
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 }
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', request => {
      const url = request.url();
      if (/source-safe-keeping|rejected|pilot-qa|contact-sheet|\/qa\/|review-only/i.test(url)) forbiddenRequests.push(url);
    });
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await assertVisibleText(page, 'Enter LeonSal');
    await assertVisibleText(page, 'Sensory & Regulation');
    await assertVisibleText(page, 'Maths & Logic');
    await assertVisibleText(page, 'Literacy');
    await assertVisibleText(page, 'Characters & Rewards');
    await assertVisibleText(page, 'I want speed choices');
    assert.equal(await page.locator('.world-map-card').count(), 5, 'Landing page should expose five world choices');
    assert.equal(await page.locator('.need-card.bus-need').getAttribute('href'), 'v2-double-decker-bus.html', 'Landing bus need should open the V2 double-decker bus');
    assert.equal(await page.locator('.wordmark').getAttribute('href'), 'v2-home.html', 'Landing wordmark should enter the V2 world');
    assert.equal(await page.locator('.maths-world').getAttribute('href'), 'v2-number-merge.html', 'Landing maths card should use V2 Number Merge');
    assert.equal(await page.locator('.literacy-world').getAttribute('href'), 'v2-alphabet-adventure.html', 'Landing literacy card should use V2 Alphabet Adventure');
    assert.equal(await page.getByRole('navigation', { name: 'LeonSal sections' }).getByRole('link', { name: 'Characters', exact: true }).getAttribute('href'), 'v2-character-world.html', 'Landing character nav should open child-facing Character World');
    assert.equal(await page.getByRole('link', { name: 'Meet the Characters', exact: true }).getAttribute('href'), 'v2-character-world.html', 'Landing hero character action should open Character World');
    assert.equal(await page.locator('.archive-link').getAttribute('href'), 'sensory-lab.html', 'Legacy lab should be retained only as an archive link');
    assert(await page.locator('.runner-leon').getByText('Leon', { exact: true }).isVisible(), 'Landing procedural Leon marker should show Leon');
    assert(await page.locator('.runner-zaya').getByText('Zaya', { exact: true }).isVisible(), 'Landing procedural Zaya marker should show Zaya');
    assert(await page.locator('[data-approved-character="battery-buddy"]').count(), 'Landing page should include only approved Battery art hook');
    assert.equal(await page.locator('img[src*="assets/characters-v2"][src*="leon"]').count(), 0, 'Landing page must not render pending Leon art');
    assert.equal(await page.locator('img[src*="assets/characters-v2"][src*="zaya"]').count(), 0, 'Landing page must not render pending Zaya art');
    await page.getByRole('button', { name: 'Settings' }).click();
    assert(await page.locator('#hubSettings [data-key="motion"]').isVisible(), 'Landing settings should expose shared motion setting');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#hubSettings').getAttribute('data-open'), 'false', 'Escape should close landing settings');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `Landing page has horizontal overflow of ${overflow}px at ${viewport.width}px`);
    await page.screenshot({ path: `${out}/index-${viewport.width}.png`, fullPage: true });
    await context.close();
  }
  assert.deepEqual(errors, [], `Landing page errors: ${errors.join('; ')}`);
  assert.deepEqual(forbiddenRequests, [], `Forbidden landing art requests: ${forbiddenRequests.join(', ')}`);
  await fs.writeFile(`${out}/results.json`, JSON.stringify({ passed: true, viewports, forbiddenRequests }, null, 2) + '\n');
  console.log('V2 landing page checks passed.');
} finally {
  await browser.close();
  if (!externalBase && server.listening) await new Promise(resolve => server.close(resolve));
}

async function assertVisibleText(page, text) {
  assert(await page.getByText(text, { exact: true }).first().isVisible(), `Missing visible landing text: ${text}`);
}
