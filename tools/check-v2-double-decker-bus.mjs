import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-double-decker-bus';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
let server = null;

async function startServer() {
  if (process.env.LEONSAL_BASE_URL) return process.env.LEONSAL_BASE_URL.replace(/\/$/, '');
  server = http.createServer(async (req, res) => {
    const file = path.resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
    try {
      res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(await fs.readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function main() {
  await fs.mkdir(out, { recursive: true });
  const base = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const failures = [];
  page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('pageerror', (error) => failures.push(error.message));
  try {
    await page.goto(`${base}/v2-double-decker-bus.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.bus-choice').count(), 3, 'Expected three bus choices');
    assert.equal(await page.locator('.bus-speed').count(), 5, 'Expected five speed choices');
    for (const name of ['UK Bus', 'Hong Kong Bus', 'Night Bus', 'Super slow', 'Slow', 'Medium', 'Fast', 'Super speed', 'Go', 'Stop bus', 'Reset', 'Pause', 'Finished']) {
      await assertVisible(page, name);
    }
    assert.equal(await page.locator('.bus-landmark').count(), 2, 'Expected two visible journey landmarks');
    assert.equal(await page.locator('.bus-city').count(), 2, 'Expected skyline depth elements');
    assert.equal(await page.locator('.bus-lights').count(), 1, 'Expected arrival light effect');
    const geometry = await page.evaluate(() => {
      const targets = ['.game-scene', '.bus-choice-row', '.bus-speed-row', '.drawer-controls', '.session-controls'];
      return targets.map((selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { selector, left: rect.left, right: rect.right, width: rect.width };
      });
    });
    for (const item of geometry) {
      assert(item.left >= -1, `${item.selector} overflows left at ${item.left}`);
      assert(item.right <= 391, `${item.selector} overflows right at ${item.right}`);
    }
    await page.getByRole('button', { name: 'Hong Kong Bus', exact: true }).click();
    await page.getByRole('button', { name: 'Super speed', exact: true }).click();
    let state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert.equal(state.bus, 'hong-kong');
    assert.equal(state.speed, 'super-speed');
    assert.equal(state.destination, 'Harbour');
    assert.equal(state.routeMark, 'HK');
    assert(state.effectiveSpeed > 18, 'Super speed should be faster than slow before calm mode');
    await page.getByRole('button', { name: 'Night Bus', exact: true }).click();
    state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert.equal(state.bus, 'night');
    assert.equal(state.destination, 'Home');
    assert.equal(state.routeMark, 'Nite');
    await page.evaluate(() => settings.set({ calmMode: true }));
    state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert(state.effectiveSpeed <= 18, 'Calm mode must cap the bus at slow speed');
    await page.evaluate(() => {
      settings.set({ calmMode: false, reducedMotion: false });
      setProgress(36);
    });
    state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert.equal(state.milestone, 'park', 'Park landmark should activate around one-third progress');
    await page.evaluate(() => setProgress(62));
    state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert.equal(state.milestone, 'library', 'Library landmark should activate after mid-route progress');
    await page.evaluate(() => settings.set({ reducedMotion: true }));
    await page.getByRole('button', { name: 'Go', exact: true }).click();
    state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert.equal(state.progress, 100, 'Reduced motion should complete without continuous travel');
    assert.equal(state.milestone, 'finish', 'Finish milestone should activate on arrival');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    state = await page.evaluate(() => window.__doubleDeckerBusProofState());
    assert.equal(state.bus, 'uk');
    assert.equal(state.speed, 'medium');
    assert.equal(state.progress, 0);
    assert.equal(state.destination, 'Park');
    assert.equal(state.routeMark, 'UK');
    await page.screenshot({ path: `${out}/double-decker-bus-390.png`, fullPage: true });
    await fs.writeFile(`${out}/results.json`, JSON.stringify({ passed: true, viewport: { width: 390, height: 844 }, geometry, checks: ['three bus types', 'five speed modes', 'journey landmarks', 'park milestone', 'library milestone', 'finish milestone', 'skyline depth', 'arrival lights', 'calm speed cap', 'reduced-motion static completion', 'reset restores defaults', 'no horizontal overflow'], consoleErrors: failures }, null, 2) + '\n');
    assert.equal(failures.length, 0, `Console errors: ${failures.join('; ')}`);
    console.log('V2 double-decker bus checks passed.');
  } finally {
    await browser.close();
    await new Promise((resolve) => context.close().then(resolve));
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

async function assertVisible(page, name) {
  assert(await page.getByRole('button', { name, exact: true }).or(page.getByRole('link', { name, exact: true })).first().isVisible(), `${name} is not visible`);
}

main().catch((error) => {
  server?.close();
  console.error(error);
  process.exitCode = 1;
});
