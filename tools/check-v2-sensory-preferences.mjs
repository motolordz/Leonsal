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
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});

async function main() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const browser = await chromium.launch();
  const out = 'qa/v2-sensory-preferences';
  await fs.mkdir(out, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/v2-home.html`, { waitUntil: 'networkidle' });
    const engineResult = await page.evaluate(() => {
      localStorage.removeItem('leonsal-v2-pref-test');
      const settings = new LeonSalV2.SensorySettings('leonsal-v2-pref-test');
      settings.set({
        motion: true,
        sound: true,
        voice: true,
        music: true,
        vibration: true,
        calmMode: true,
        particles: 'low',
        speed: 'lively',
        effectsLevel: 'medium',
        voiceLevel: 'medium',
        musicLevel: 'off',
        contrast: 'strong',
        pace: 'guided',
        unknown: 'ignored'
      });
      const saved = new LeonSalV2.SensorySettings('leonsal-v2-pref-test');
      saved.set({ particles: 'chaos', speed: 'fastest', effectsLevel: 'loud', voiceLevel: 'max', musicLevel: 'blast', contrast: 'extreme', pace: 'forced' });
      return {
        value: saved.value,
        allowsMotion: saved.allowsMotion(),
        speedFactor: saved.speedFactor(),
        particleCount: saved.particleCount(10),
        effectsLevelValue: saved.levelValue('effectsLevel'),
        voiceLevelValue: saved.levelValue('voiceLevel'),
        musicLevelValue: saved.levelValue('musicLevel')
      };
    });
    assert.equal(engineResult.value.sound, true);
    assert.equal(engineResult.value.voice, true);
    assert.equal(engineResult.value.music, true);
    assert.equal(engineResult.value.vibration, true);
    assert.equal(engineResult.value.calmMode, true);
    assert.equal(engineResult.value.particles, 'low');
    assert.equal(engineResult.value.speed, 'lively');
    assert.equal(engineResult.value.effectsLevel, 'medium');
    assert.equal(engineResult.value.voiceLevel, 'medium');
    assert.equal(engineResult.value.musicLevel, 'off');
    assert.equal(engineResult.value.contrast, 'strong');
    assert.equal(engineResult.value.pace, 'guided');
    assert.equal(engineResult.allowsMotion, false, 'OS reduced motion must cap motion even when saved motion is on');
    assert.equal(engineResult.speedFactor, 0, 'Reduced motion should cap speed factor to 0');
    assert.equal(engineResult.particleCount, 0, 'Calm mode should cap particles to 0');
    assert.equal(engineResult.effectsLevelValue, 0.68, 'Effects level should persist independently');
    assert.equal(engineResult.voiceLevelValue, 0.68, 'Voice level should persist independently');
    assert.equal(engineResult.musicLevelValue, 0, 'Music level off should cap music independently');

    await page.getByRole('button', { name: 'Settings' }).click();
    for (const key of ['motion', 'sound', 'voice', 'music', 'vibration', 'calmMode', 'particles', 'speed', 'effectsLevel', 'voiceLevel', 'musicLevel', 'contrast', 'pace']) {
      assert(await page.locator(`#hubSettings [data-key="${key}"]`).isVisible(), `Missing ${key} setting`);
    }
    const contrast = page.locator('#hubSettings [data-key="contrast"]');
    await contrast.click();
    assert.equal(await page.locator('body').getAttribute('data-contrast'), 'strong');
    assert.match(await contrast.textContent(), /Strong/);
    const particles = page.locator('#hubSettings [data-key="particles"]');
    await particles.click();
    assert.match(await particles.textContent(), /Low/);
    const speed = page.locator('#hubSettings [data-key="speed"]');
    await speed.click();
    assert.match(await speed.textContent(), /Slow/);
    await page.screenshot({ path: `${out}/v2-home-settings-390.png`, fullPage: true });
    await page.evaluate(() => {
      localStorage.setItem('leonsal-v2-settings', JSON.stringify({
        motion: true,
        sound: true,
        vibration: true,
        contrast: 'strong',
        reducedMotion: false
      }));
      localStorage.removeItem('leonsal-sensory-v1');
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/sensory-lab.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#motionToggle').getAttribute('aria-checked'), 'true', 'Legacy home did not read V2 motion setting');
    assert.equal(await page.locator('#soundToggle').getAttribute('aria-checked'), 'true', 'Legacy home did not read V2 sound setting');
    assert.equal(await page.locator('#hapticToggle').getAttribute('aria-checked'), 'true', 'Legacy home did not read V2 vibration setting');
    assert(await page.locator('body.high-contrast').count(), 'Legacy home did not apply V2 strong contrast setting');
    await page.locator('#soundToggle').click();
    await page.locator('#hapticToggle').click();
    const bridged = await page.evaluate(() => JSON.parse(localStorage.getItem('leonsal-v2-settings') || '{}'));
    assert.equal(bridged.sound, false, 'Legacy sound toggle did not update V2 settings');
    assert.equal(bridged.vibration, false, 'Legacy vibration toggle did not update V2 settings');

    await fs.writeFile(`${out}/results.json`, JSON.stringify({
      passed: true,
      engineResult,
      checkedSettings: 13,
      legacyBridge: { readV2: true, writesV2: true }
    }, null, 2) + '\n');
    console.log('V2 sensory preference checks passed.');
    await context.close();
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
