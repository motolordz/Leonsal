import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-route-lifecycle';
const routes = [
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
  'v2-shape-builder.html',
  'v2-letter-tracing.html',
  'v2-number-tracing.html',
  'v2-light-trail.html',
  'v2-hold-to-breathe.html',
  'v2-trace-engine.html',
  'v2-orbit-engine.html',
  'v2-cause-effect-engine.html'
];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const file = path.resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
  try {
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});

await fs.mkdir(out, { recursive: true });
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const browser = await chromium.launch();
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  const visits = [];
  for (let pass = 0; pass < 3; pass += 1) {
    for (const route of routes) {
      await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' });
      const state = await page.evaluate(() => {
        window.__lifecycleShellIds ||= new WeakMap();
        window.__lifecycleNextShellId ||= 1;
        const shell = window.__leonSalActiveGameShell;
        if (shell && !window.__lifecycleShellIds.has(shell)) window.__lifecycleShellIds.set(shell, window.__lifecycleNextShellId++);
        return {
          shellPresent: Boolean(shell),
          controls: document.querySelectorAll('.session-controls').length,
          dialogs: document.querySelectorAll('.session-dialog').length,
          paused: document.body.dataset.paused,
          inert: document.querySelector('.game-scene')?.inert || false,
          motion: document.body.dataset.motion
        };
      });
      assert(state.shellPresent, `${route}: no active shell after navigation`);
      assert.equal(state.controls, 1, `${route}: duplicate session controls after repeated navigation`);
      assert.equal(state.dialogs, 1, `${route}: duplicate session dialogs after repeated navigation`);
      assert.equal(state.paused, 'false', `${route}: paused state leaked from previous route`);
      assert.equal(state.inert, false, `${route}: inert state leaked from previous route`);
      assert.equal(state.motion, 'off', `${route}: reduced-motion cap missing after repeated navigation`);
      visits.push({ pass, route });
      await page.getByRole('button', { name: 'Pause' }).click();
      assert.equal(await page.locator('body').getAttribute('data-paused'), 'true', `${route}: pause did not set body state`);
      const cleanup = await page.evaluate(() => {
        let destroys = 0;
        const shell = window.__leonSalActiveGameShell;
        shell.own({ destroy: () => { destroys += 1; } });
        const ownedBefore = shell.resources.size;
        shell.destroy();
        return {
          destroys,
          ownedBefore,
          shellCleared: window.__leonSalActiveGameShell === null,
          controls: document.querySelectorAll('.session-controls').length,
          dialogs: document.querySelectorAll('.session-dialog').length,
          paused: document.body.dataset.paused,
          inert: document.querySelector('.game-scene')?.inert || false
        };
      });
      assert.equal(cleanup.destroys, 1, `${route}: owned resource did not destroy exactly once`);
      assert(cleanup.ownedBefore >= 1, `${route}: shell did not track owned resource`);
      assert.equal(cleanup.shellCleared, true, `${route}: shell did not clear active reference on destroy`);
      assert.equal(cleanup.controls, 0, `${route}: controls remained after destroy`);
      assert.equal(cleanup.dialogs, 0, `${route}: dialog remained after destroy`);
      assert.equal(cleanup.paused, 'false', `${route}: paused state remained after destroy`);
      assert.equal(cleanup.inert, false, `${route}: inert state remained after destroy`);
    }
  }
  assert.deepEqual(failures, []);
  await page.screenshot({ path: `${out}/last-route-390.png`, fullPage: true });
  await fs.writeFile(`${out}/results.json`, JSON.stringify({
    passed: true,
    viewport: { width: 390, height: 844 },
    routeVisits: visits.length,
    checks: [
      'single session controls per route',
      'single session dialog per route',
      'active shell exists after each navigation',
      'pause state does not leak',
      'inert state does not leak',
      'reduced-motion cap reapplies',
      'owned resources destroy exactly once',
      'no console/page errors'
    ],
    visits
  }, null, 2) + '\n');
  console.log(`V2 route lifecycle checks passed: ${visits.length} navigations.`);
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
