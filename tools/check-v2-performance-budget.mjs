import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-performance-budget';
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
  'v2-shape-tracing.html',
  'v2-colour-match.html',
  'v2-big-small.html',
  'v2-pattern-builder.html',
  'v2-sort-it.html',
  'v2-planet-pals.html',
  'v2-build-solar-system.html',
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

async function sampleRoute(page, base, route) {
  await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (route === 'v2-energy-battery.html') {
    const box = await page.locator('#energyTrack').boundingBox();
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2, { steps: 14 });
    await page.mouse.up();
  }
  if (route === 'v2-dash-dock.html') await page.getByRole('button', { name: 'Move right' }).click();
  if (route === 'v2-bubble-garden.html') await page.getByRole('button', { name: 'Pop a bubble' }).click();
  if (route === 'v2-firefly-catch.html') await page.getByRole('button', { name: 'Glow one' }).click();
  if (route === 'v2-calm-rain-window.html') await page.getByRole('button', { name: 'Ripple' }).click();
  if (route === 'v2-snow-globe.html') await page.getByRole('button', { name: 'Shake gently' }).click();
  if (route === 'v2-star-shower.html') await page.getByRole('button', { name: 'Soft star' }).click();
  if (route === 'v2-growing-garden.html') await page.getByRole('button', { name: 'Water' }).click();
  if (route === 'v2-number-merge.html') {
    await page.locator('.number-buddy').nth(0).click();
    await page.locator('.number-buddy').nth(1).click();
  }
  if (route === 'v2-alphabet-adventure.html') await page.getByRole('button', { name: 'Next' }).click();
  if (route === 'v2-shape-builder.html') await page.locator('.shape-piece').first().click();
  if (route === 'v2-letter-tracing.html') await page.getByRole('button', { name: 'Step' }).click();
  if (route === 'v2-number-tracing.html') await page.getByRole('button', { name: 'Step' }).click();
  if (route === 'v2-shape-tracing.html') await page.getByRole('button', { name: 'Step' }).click();
  if (route === 'v2-colour-match.html') {
    await page.locator('.colour-drop').first().click();
    await page.locator('.colour-well').first().click();
  }
  if (route === 'v2-big-small.html') {
    await page.locator('.size-toy').first().click();
    await page.locator('.size-basket').first().click();
  }
  if (route === 'v2-pattern-builder.html') await page.getByRole('button', { name: 'Add next' }).click();
  if (route === 'v2-sort-it.html') {
    await page.locator('.sort-item').first().click();
    await page.locator('.sort-basket').first().click();
  }
  if (route === 'v2-planet-pals.html') await page.getByRole('button', { name: 'Next' }).click();
  if (route === 'v2-build-solar-system.html') await page.getByRole('button', { name: 'Place next' }).click();
  if (route === 'v2-light-trail.html') {
    const box = await page.locator('#canvas').boundingBox();
    await page.mouse.move(box.x + 60, box.y + 160);
    await page.mouse.down();
    await page.mouse.move(box.x + 290, box.y + 420, { steps: 12 });
    await page.mouse.up();
  }
  if (route === 'v2-hold-to-breathe.html') await page.getByRole('button', { name: 'Expand' }).click();
  if (route === 'v2-trace-engine.html') await page.getByRole('button', { name: 'Step' }).click();
  if (route === 'v2-cause-effect-engine.html') await page.getByRole('button', { name: 'Light' }).click();

  return page.evaluate(async () => {
    const samples = [];
    const longTasks = [];
    let observer = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTasks.push(Math.round(entry.duration));
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (_error) {
      observer = null;
    }
    let last = performance.now();
    const endAt = last + 1300;
    await new Promise((resolve) => {
      const tick = (now) => {
        const dt = now - last;
        last = now;
        if (dt > 0) samples.push(Math.min(60, 1000 / dt));
        if (now < endAt) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    observer?.disconnect();
    const avg = samples.reduce((sum, fps) => sum + fps, 0) / samples.length;
    return {
      frames: samples.length,
      averageFps: Number(avg.toFixed(1)),
      worstObservedFps: Number(Math.min(...samples).toFixed(1)),
      longTasks
    };
  });
}

await fs.mkdir(out, { recursive: true });
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const browser = await chromium.launch();
const base = `http://127.0.0.1:${server.address().port}`;
const results = [];
try {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const result = await sampleRoute(page, base, route);
    assert(result.frames > 40, `${route} did not produce enough frame samples`);
    assert(result.averageFps >= 45, `${route} average FPS below budget: ${result.averageFps}`);
    assert(result.worstObservedFps >= 20, `${route} worst observed FPS below budget: ${result.worstObservedFps}`);
    assert(result.longTasks.length <= 1, `${route} produced too many long tasks: ${result.longTasks.join(', ')}`);
    results.push({ route, ...result });
    await context.close();
  }
  await fs.writeFile(`${out}/results.json`, JSON.stringify({
    passed: true,
    viewport: { width: 390, height: 844 },
    note: 'FPS is sampled through requestAnimationFrame in Playwright and should be treated as a route-level smoke budget, not lab-grade profiling.',
    results
  }, null, 2) + '\n');
  console.log('V2 performance budget checks passed.');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
