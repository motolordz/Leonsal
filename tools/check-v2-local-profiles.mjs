import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const out = 'qa/v2-local-profiles';
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
  await page.goto(`${base}/v2-home.html`, { waitUntil: 'networkidle' });
  assert(await page.getByLabel('Local child profile controls').isVisible(), 'Home missing local profile controls');
  assert.equal(await page.locator('#localProfile').inputValue(), 'default', 'Default shared profile is not active');
  assert(await page.getByText('not scores, grades or mastery').isVisible(), 'Profile copy must avoid assessment language');
  const bodyText = await page.locator('body').textContent();
  assert(!/\bdiagnos|autism subtype|dysregulat|sensory[- ]seeking|sensory[- ]avoiding\b/i.test(bodyText), 'Profile UI must not infer medical or sensory labels');

  await page.locator('#newProfileName').fill('Zaya');
  await page.getByRole('button', { name: 'Add profile' }).click();
  const activeProfileId = await page.locator('#localProfile').inputValue();
  assert.match(activeProfileId, /^profile-/, 'Added profile did not become active');
  assert.equal(await page.locator('#newProfileName').inputValue(), '', 'New profile input was not cleared');

  await page.goto(`${base}/v2-bubble-garden.html`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Finished' }).click();
  await page.getByRole('button', { name: 'Keep playing' }).click();
  const storageAfterPlay = await page.evaluate((profileId) => ({
    active: JSON.parse(localStorage.getItem('leonsal-v2-local-profiles') || '{}'),
    shared: JSON.parse(localStorage.getItem('leonsal-v2-profile-progress') || '{}'),
    child: JSON.parse(localStorage.getItem(`leonsal-v2-profile-progress:${profileId}`) || '{}')
  }), activeProfileId);
  assert.equal(storageAfterPlay.active.activeId, activeProfileId, 'Active local profile was not persisted');
  assert.equal(storageAfterPlay.child.progress?.['bubble-garden']?.visits, 1, 'Child profile did not receive route visit');
  assert(storageAfterPlay.child.finished?.includes('bubble-garden'), 'Child profile did not receive Finished event');
  assert.equal(storageAfterPlay.shared.progress?.['bubble-garden'], undefined, 'Shared profile was polluted by child activity');

  await page.goto(`${base}/v2-home.html`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#localProfile').inputValue(), activeProfileId, 'Home did not restore active profile');
  assert(await page.locator('#progressSummary').getByText('Quiet Bubble Garden').isVisible(), 'Home did not show active profile notes');
  await page.locator('#localProfile').selectOption('default');
  assert(await page.locator('#progressSummary').getByText('No local activity notes yet.').isVisible(), 'Default profile should keep separate notes');
  await page.locator('#localProfile').selectOption(activeProfileId);
  await page.getByRole('button', { name: 'Remove' }).click();
  assert.equal(await page.locator('#localProfile').inputValue(), 'default', 'Removing child profile did not return to shared profile');
  const removed = await page.evaluate((profileId) => localStorage.getItem(`leonsal-v2-profile-progress:${profileId}`), activeProfileId);
  assert.equal(removed, null, 'Removing child profile did not clear its local notes');

  await page.screenshot({ path: `${out}/v2-home-local-profiles-390.png`, fullPage: true });
  await fs.writeFile(`${out}/results.json`, JSON.stringify({
    passed: true,
    viewport: { width: 390, height: 844 },
    checks: [
      'local-only profile controls visible',
      'no score/mastery wording',
      'no inferred medical or sensory labels',
      'active profile persists',
      'game activity records under active profile key',
      'shared profile remains separate',
      'profile removal clears that local profile notes'
    ]
  }, null, 2) + '\n');
  console.log('V2 local profile checks passed.');
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
