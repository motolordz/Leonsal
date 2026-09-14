import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-sensory-site-smoke';
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
  'v2-light-trail.html',
  'v2-hold-to-breathe.html',
  'v2-trace-engine.html',
  'v2-orbit-engine.html',
  'v2-cause-effect-engine.html'
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
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

async function sampleCanvas(page, selector) {
  return page.locator(selector).evaluate((canvas) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const sampleWidth = Math.min(width, 320);
    const sampleHeight = Math.min(height, 320);
    const x = Math.max(0, Math.floor((width - sampleWidth) / 2));
    const y = Math.max(0, Math.floor((height - sampleHeight) / 2));
    const data = ctx.getImageData(x, y, sampleWidth, sampleHeight).data;
    let alpha = 0;
    for (let i = 3; i < data.length; i += 4) alpha += data[i];
    return { width, height, alpha };
  });
}

async function main() {
  await fs.mkdir(out, { recursive: true });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const results = [];

  try {
  for (const route of routes) {
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
    await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${out}/${route.replace('.html', '')}-390.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${route} has horizontal overflow`);
    assert.equal(failedRequests.length, 0, `${route} has failed requests: ${failedRequests.join(', ')}`);
    assert.equal(errors.length, 0, `${route} has console/page errors: ${errors.join(', ')}`);
    assert(!requests.some((url) => /source-safe-keeping|qa\/|contact-sheet|rejected/i.test(url)), `${route} requested blocked art/evidence path`);

    if (route === 'v2-home.html') {
      await page.evaluate(() => {
        localStorage.setItem('leonsal-v2-profile-progress', JSON.stringify({
          preferences: {},
          progress: { 'bubble-garden': { visits: 2, updatedAt: new Date().toISOString() } },
          finished: ['bubble-garden']
        }));
      });
      await page.reload({ waitUntil: 'networkidle' });
      assert(await page.getByText('Local activity notes').isVisible(), 'V2 home missing local progress panel');
      assert(await page.locator('#progressSummary').getByText('Quiet Bubble Garden').isVisible(), 'V2 home did not render local progress entry');
      assert(await page.getByText(/not scores, grades or mastery/i).isVisible(), 'V2 home local progress copy implies assessment');
      await page.getByRole('button', { name: 'Settings' }).click();
      assert.equal(await page.locator('#hubSettings').getAttribute('data-open'), 'true');
      assert.equal(await page.locator('.hub-game-grid .world-game').count(), 10);
      assert.equal(await page.locator('.hub-engine-grid .world-game').count(), 4);
    } else {
      await page.getByRole('button', { name: 'Sensory settings' }).click();
      assert.equal(await page.locator('#settings').getAttribute('data-open'), 'true', `${route} settings did not open`);
      assert.equal(await page.locator('#settings [data-key]').count(), 13, `${route} does not expose the full shared sensory settings panel`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#settings').getAttribute('data-open'), 'false', `${route} settings did not close`);
      assert(await page.locator('.session-controls').isVisible(), `${route} missing session controls`);
      assert(await page.getByRole('button', { name: 'Pause' }).isVisible(), `${route} missing Pause`);
      assert(await page.getByRole('button', { name: 'Finished' }).isVisible(), `${route} missing Finished`);
      if (route === 'v2-energy-battery.html') {
        await page.getByRole('button', { name: 'Finished' }).click();
        assert(await page.getByText('All done for now').isVisible(), `${route} did not show Finished dialog`);
        const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('leonsal-v2-profile-progress') || '{}'));
        assert.equal(profile.progress?.['energy-battery']?.visits, 1, `${route} did not record a local visit`);
        assert(profile.finished?.includes('energy-battery'), `${route} did not record Finished locally`);
        await page.getByRole('button', { name: 'Keep playing' }).click();
      }
    }

    if (route === 'v2-bubble-garden.html') {
      const box = await page.locator('#canvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      const canvas = await sampleCanvas(page, '#canvas');
      assert(canvas.width >= 340 && canvas.height > 400, 'Bubble canvas is not sized for mobile play');
    }
    if (route === 'v2-firefly-catch.html') {
      const box = await page.locator('#fireflyCanvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      const canvas = await sampleCanvas(page, '#fireflyCanvas');
      await page.getByRole('button', { name: 'Glow one' }).click();
      const state = await page.evaluate(() => window.__fireflyProofState?.());
      assert(canvas.width >= 340 && canvas.height > 400, 'Firefly canvas is not sized for mobile play');
      assert(state.glows > 0, 'Firefly Catch did not create a glow response');
      await page.evaluate(() => settings.set({ calmMode: true }));
      const calmState = await page.evaluate(() => window.__fireflyProofState?.());
      assert(calmState.fireflies <= 6, 'Firefly Catch calm mode did not reduce fireflies');
    }
    if (route === 'v2-calm-rain-window.html') {
      const box = await page.locator('#rainCanvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      const canvas = await sampleCanvas(page, '#rainCanvas');
      const state = await page.evaluate(() => window.__rainProofState?.());
      assert(canvas.width >= 320 && canvas.height > 400, 'Rain canvas is not sized for mobile play');
      assert(state.ripples > 0, 'Rain window did not create a touch ripple');
      await page.evaluate(() => settings.set({ calmMode: true }));
      const calmState = await page.evaluate(() => window.__rainProofState?.());
      assert(calmState.drops <= 28, 'Rain window calm mode did not reduce drops');
    }
    if (route === 'v2-snow-globe.html') {
      const box = await page.locator('#snowCanvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      const canvas = await sampleCanvas(page, '#snowCanvas');
      await page.getByRole('button', { name: 'Shake gently' }).click();
      const state = await page.evaluate(() => window.__snowGlobeProofState?.());
      assert(canvas.width >= 340 && canvas.height > 400, 'Snow canvas is not sized for mobile play');
      assert(state.energy > 0, 'Snow Globe did not respond to shake');
      await page.evaluate(() => settings.set({ calmMode: true }));
      const calmState = await page.evaluate(() => window.__snowGlobeProofState?.());
      assert(calmState.flakes <= 32, 'Snow Globe calm mode did not reduce flakes');
    }
    if (route === 'v2-star-shower.html') {
      const box = await page.locator('#starCanvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      const canvas = await sampleCanvas(page, '#starCanvas');
      await page.getByRole('button', { name: 'Soft star' }).click();
      const state = await page.evaluate(() => window.__starShowerProofState?.());
      assert(canvas.width >= 340 && canvas.height > 400, 'Star canvas is not sized for mobile play');
      assert(state.stars > 0, 'Star Shower did not create a star response');
      await page.evaluate(() => settings.set({ calmMode: true }));
      const calmState = await page.evaluate(() => window.__starShowerProofState?.());
      assert(calmState.maxStars <= 5, 'Star Shower calm mode did not cap active stars');
    }
    if (route === 'v2-growing-garden.html') {
      const box = await page.locator('#gardenCanvas').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      const canvas = await sampleCanvas(page, '#gardenCanvas');
      await page.getByRole('button', { name: 'Water' }).click();
      const state = await page.evaluate(() => window.__growingGardenProofState?.());
      assert(canvas.width >= 340 && canvas.height > 400, 'Garden canvas is not sized for mobile play');
      assert(state.grown > 0, 'Growing Garden did not create a growth response');
      await page.evaluate(() => settings.set({ calmMode: true }));
      const calmState = await page.evaluate(() => window.__growingGardenProofState?.());
      assert(calmState.plants <= 3, 'Growing Garden calm mode did not reduce plant count');
    }
    if (route === 'v2-number-merge.html') {
      await page.locator('.number-buddy').nth(0).click();
      await page.locator('.number-buddy').nth(1).click();
      const state = await page.evaluate(() => window.__numberMergeProofState?.());
      assert.equal(state.result, state.selected[0] + state.selected[1], 'Number Merge did not combine selected numbers');
      await page.getByRole('button', { name: 'Clear' }).click();
      const cleared = await page.evaluate(() => window.__numberMergeProofState?.());
      assert.equal(cleared.result, null, 'Number Merge clear did not reset result');
    }
    if (route === 'v2-light-trail.html') {
      const box = await page.locator('#canvas').boundingBox();
      await page.mouse.move(box.x + 70, box.y + 140);
      await page.mouse.down();
      await page.mouse.move(box.x + 280, box.y + 360, { steps: 8 });
      await page.mouse.up();
      const canvas = await sampleCanvas(page, '#canvas');
      assert(canvas.width >= 340 && canvas.height > 400, 'Trail canvas is not sized for mobile play');
      assert(canvas.alpha > 0, 'Trail canvas did not render drawing pixels');
    }
    if (route === 'v2-dash-dock.html') {
      const state = await page.evaluate(() => window.__dashDockState?.());
      assert.equal(state.energy, 0);
      assert.equal(state.dashPosition, 0);
      await page.evaluate(() => window.__dashDockSetPosition?.(50));
      const halfway = await page.evaluate(() => window.__dashDockState?.());
      assert.equal(halfway.energy, 0, 'Dash charged before dock');
    }
    if (route === 'v2-trace-engine.html') {
      await page.getByRole('button', { name: 'Step' }).click();
      const state = await page.evaluate(() => window.__traceProofState?.());
      assert(state.progress > 0, 'Trace step alternative did not advance progress');
      assert.equal(state.hasTapAlternative, true);
    }
    if (route === 'v2-orbit-engine.html') {
      const state = await page.evaluate(() => window.__orbitProofState?.());
      assert.equal(state.itemCount, 2);
      assert.equal(state.educationalScaleNote, true);
    }
    if (route === 'v2-cause-effect-engine.html') {
      await page.getByRole('button', { name: 'Light' }).click();
      await page.getByRole('button', { name: 'Grow' }).click();
      await page.getByRole('button', { name: 'Reset' }).click();
      const state = await page.evaluate(() => window.__causeEffectProofState?.());
      assert.equal(state.deterministicReset, true);
      assert.equal(state.registeredEffects, 3);
    }

    if (route !== 'v2-home.html') {
      await page.evaluate(() => window.__leonSalActiveGameShell?.destroy());
      assert.equal(await page.locator('.session-controls').count(), 0, `${route} session controls survived shell destroy`);
      assert.equal(await page.locator('.session-dialog').count(), 0, `${route} session dialog survived shell destroy`);
      assert.equal(await page.locator('body').getAttribute('data-paused'), 'false', `${route} did not clear paused state on shell destroy`);
    }

    results.push({ route, passed: true });
    await context.close();
  }
    await fs.writeFile(`${out}/results.json`, JSON.stringify({ passed: true, routes, results }, null, 2) + '\n');
    console.log(`V2 sensory site smoke passed: ${routes.length} routes`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  server.close();
  console.error(error);
  process.exitCode = 1;
});
