import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-sensory-mixer';
const externalBase = process.env.LEONSAL_BASE_URL?.replace(/\/$/, '');
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
if (!externalBase) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
}

const browser = await chromium.launch();
const base = externalBase || `http://127.0.0.1:${server.address().port}`;
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}/v2-home.html`, { waitUntil: 'networkidle' });
  assert(await page.getByText('Sensory mixer').isVisible(), 'Home missing sensory mixer');
  assert.equal(await page.locator('#mixerPresets button').count(), 3, 'Mixer should expose three starter presets');
  assert(await page.getByText('Presets can only stay within the global limits above.').isVisible(), 'Mixer must explain global preference ceilings');
  const text = await page.locator('.hub-mixer-panel').textContent();
  assert(!/\bscore|streak|mastery|diagnos|dysregulat|sensory[- ]seeking|sensory[- ]avoiding\b/i.test(text), 'Mixer must avoid scoring and inferred labels');
  const contract = await page.evaluate(() => {
    const settings = new LeonSalV2.SensorySettings('leonsal-v2-mixer-test');
    settings.set({ motion: true, sound: false, vibration: false, calmMode: true, particles: 'off', speed: 'slow', reducedMotion: true });
    const mixer = new LeonSalV2.SensoryMixerEngine(settings, { key: 'leonsal-v2-mixer-test-worlds' });
    const star = mixer.applyPreset('star-trail');
    settings.set({ sound: true, calmMode: false, particles: 'normal', speed: 'normal', reducedMotion: true });
    const aliasSpeed = settings.value.speed;
    settings.set({ particles: 'low', speed: 'medium' });
    const bubble = mixer.applyPreset('bubble-calm');
    return { star, bubble, aliasSpeed, saved: JSON.parse(localStorage.getItem('leonsal-v2-mixer-test-worlds') || '[]') };
  });
  assert.equal(contract.star.effective.motion, false, 'Reduced motion must cap preset motion off');
  assert.equal(contract.star.effective.sound, false, 'Sound Off must keep preset silent');
  assert.equal(contract.star.effective.particles, 'off', 'Calm/Particles Off must cap preset particles');
  assert.equal(contract.star.effective.speed, 'slow', 'Slow global speed must cap preset speed');
  assert.equal(contract.star.effective.exitAlwaysAvailable, true, 'Saved world must keep exit available');
  assert.equal(contract.bubble.effective.motion, false, 'OS reduced-motion context must cap later preset motion too');
  assert.equal(contract.bubble.effective.particles, 'low', 'Particle request may stay within current low ceiling');
  assert.equal(contract.aliasSpeed, 'medium', 'Legacy normal speed must resolve to medium');
  assert.equal(contract.saved.length, 2, 'Mixer did not persist saved worlds locally');

  await page.getByRole('button', { name: 'Quiet Glow' }).click();
  assert(await page.locator('#mixerSummary').getByText('Quiet Glow').isVisible(), 'Mixer did not render saved preset');
  await page.screenshot({ path: `${out}/v2-home-sensory-mixer-390.png`, fullPage: true });
  await fs.writeFile(`${out}/results.json`, JSON.stringify({
    passed: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    presets: 3,
    checks: [
      'saved worlds are local presets, not games',
      'Sound Off remains silent',
      'Reduced Motion caps preset motion',
      'Calm Mode and Particles Off cap particles',
      'global speed ceiling caps preset speed',
      'exit remains available',
      'no score or inferred sensory/medical labels'
    ]
  }, null, 2) + '\n');
  console.log('V2 sensory mixer checks passed.');
  await context.close();
} finally {
  await browser.close();
  if (!externalBase && server.listening) await new Promise((resolve) => server.close(resolve));
}
