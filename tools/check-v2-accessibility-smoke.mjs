import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-accessibility-smoke';
const routes = [
  'v2-home.html',
  'v2-energy-battery.html',
  'v2-dash-dock.html',
  'v2-bubble-garden.html',
  'v2-firefly-catch.html',
  'v2-calm-rain-window.html',
  'v2-snow-globe.html',
  'v2-star-shower.html',
  'v2-growing-garden.html',
  'v2-number-merge.html',
  'v2-alphabet-adventure.html',
  'v2-light-trail.html',
  'v2-hold-to-breathe.html',
  'v2-trace-engine.html',
  'v2-orbit-engine.html',
  'v2-cause-effect-engine.html',
  'v2-offline.html'
];
const mime = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, `.${url.pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
  try {
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});

function assertNoBadRuntimeRequests(route, requests) {
  const blocked = requests.filter((url) => /source-safe-keeping|qa\/|contact-sheet|rejected|character-review|_staging/i.test(url));
  assert.equal(blocked.length, 0, `${route} requested blocked review/source paths: ${blocked.join(', ')}`);
}

async function inspectControls(page) {
  return page.evaluate(() => {
    const selector = 'a[href],button,input,select,textarea,[role="button"],[role="slider"],summary,[tabindex]:not([tabindex="-1"])';
    return [...document.querySelectorAll(selector)]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0 && !element.disabled;
      })
      .map((element) => {
        const labelledBy = element.getAttribute('aria-labelledby');
        const label = labelledBy ? document.getElementById(labelledBy)?.textContent || '' : '';
        const name = [
          element.getAttribute('aria-label'),
          label,
          element.getAttribute('title'),
          element.value,
          element.textContent
        ].find((item) => item && item.trim()) || '';
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          id: element.id || '',
          text: element.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
          name: name.trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          href: element.getAttribute('href') || '',
          tabIndex: element.tabIndex
        };
      });
  });
}

async function inspectCanvases(page) {
  return page.evaluate(() => [...document.querySelectorAll('canvas')]
    .filter((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .map((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return {
        id: canvas.id,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        name: canvas.getAttribute('aria-label') || canvas.getAttribute('aria-labelledby') || '',
        tabIndex: canvas.tabIndex
      };
    }));
}

async function checkRoute(base, browser, route) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  const requests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`));
  try {
    await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${route} has horizontal overflow`);
    assert.equal(failedRequests.length, 0, `${route} has failed requests: ${failedRequests.join(', ')}`);
    assert.equal(errors.length, 0, `${route} has console/page errors: ${errors.join(', ')}`);
    assertNoBadRuntimeRequests(route, requests);

    const controls = await inspectControls(page);
    const unnamed = controls.filter((control) => !control.name);
    assert.equal(unnamed.length, 0, `${route} has unnamed actionable controls: ${JSON.stringify(unnamed)}`);
    const tooSmall = controls.filter((control) => control.width < 44 || control.height < 44);
    assert.equal(tooSmall.length, 0, `${route} has touch targets below 44px: ${JSON.stringify(tooSmall)}`);

    if (route === 'v2-home.html') {
      await page.getByRole('button', { name: 'Settings' }).click();
      assert.equal(await page.locator('#hubSettings').getAttribute('data-open'), 'true', 'Home settings did not open');
      assert.equal(await page.locator('#hubSettings [data-key]').count(), 13, 'Home settings does not expose shared sensory keys');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#hubSettings').getAttribute('data-open'), 'false', 'Home settings did not close with Escape');
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => Boolean(document.activeElement?.textContent || document.activeElement?.getAttribute('aria-label'))), 'Home first tab stop has no accessible name');
    } else if (route === 'v2-offline.html') {
      assert(await page.getByText('This activity needs a connection.').isVisible(), 'Offline fallback heading missing');
      assert(await page.getByRole('link', { name: 'Back home' }).isVisible(), 'Offline fallback missing Back home link');
      assert(await page.getByRole('link', { name: 'Try saved activity' }).isVisible(), 'Offline fallback missing saved activity link');
    } else {
      await page.getByRole('button', { name: 'Sensory settings' }).click();
      assert.equal(await page.locator('#settings').getAttribute('data-open'), 'true', `${route} settings did not open`);
      assert.equal(await page.locator('#settings [data-key]').count(), 13, `${route} settings does not expose shared sensory keys`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#settings').getAttribute('data-open'), 'false', `${route} settings did not close with Escape`);
      assert.equal(await page.locator('body').getAttribute('data-motion'), 'off', `${route} ignored OS reduced motion cap`);
      assert(await page.locator('.session-controls').isVisible(), `${route} missing shared session controls`);
      assert(await page.getByRole('button', { name: 'Pause' }).isVisible(), `${route} missing Pause`);
      assert(await page.getByRole('button', { name: 'Finished' }).isVisible(), `${route} missing Finished`);
      await page.getByRole('button', { name: 'Pause' }).click();
      assert(await page.getByText('Take your time').isVisible(), `${route} missing pause dialog`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('body').getAttribute('data-paused'), 'false', `${route} did not resume from Escape`);
    }

    const canvases = await inspectCanvases(page);
    const unnamedCanvases = canvases.filter((canvas) => !canvas.name);
    assert.equal(unnamedCanvases.length, 0, `${route} has visible canvases without accessible labels: ${JSON.stringify(unnamedCanvases)}`);

    await page.screenshot({ path: `${out}/${route.replace('.html', '')}-390.png`, fullPage: true });
    return { route, passed: true, controls: controls.length, canvases };
  } finally {
    await context.close();
  }
}

await fs.mkdir(out, { recursive: true });
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const browser = await chromium.launch();
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const results = [];
  for (const route of routes) results.push(await checkRoute(base, browser, route));
  await fs.writeFile(`${out}/results.json`, JSON.stringify({
    passed: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    checks: [
      'no horizontal overflow',
      'no console errors or failed requests',
      'no runtime requests to source/review/QA/rejected art paths',
      'visible actionable controls have accessible names',
      'visible actionable controls meet 44px touch target minimum',
      'shared sensory settings open and close by keyboard',
      'shared sensory setting count',
      'OS reduced-motion cap',
      'session Pause and Finished controls',
      'visible canvases have accessible labels'
    ],
    results
  }, null, 2) + '\n');
  console.log(`V2 accessibility smoke passed: ${routes.length} routes.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
