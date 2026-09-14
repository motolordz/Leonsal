import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-landing-page';
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
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const browser = await chromium.launch();
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
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: 'networkidle' });
    await assertVisibleText(page, 'Enter LeonSal');
    await assertVisibleText(page, 'Sensory & Regulation');
    await assertVisibleText(page, 'Maths & Logic');
    await assertVisibleText(page, 'Literacy');
    await assertVisibleText(page, 'Characters & Rewards');
    assert.equal(await page.locator('.world-map-card').count(), 5, 'Landing page should expose five world choices');
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
  await new Promise(resolve => server.close(resolve));
}

async function assertVisibleText(page, text) {
  assert(await page.getByText(text, { exact: true }).first().isVisible(), `Missing visible landing text: ${text}`);
}
