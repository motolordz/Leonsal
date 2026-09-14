import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const externalBase = process.env.LEONSAL_BASE_URL?.replace(/\/$/, '');
const mime = { '.html': 'text/html', '.js': 'text/javascript' };
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
  if (!externalBase) {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base = externalBase || `http://127.0.0.1:${server.address().port}`;
  try {
    await page.goto(`${base}/v2-home.html`, { waitUntil: 'networkidle' });
    const result = await page.evaluate(async () => {
      const settings = new LeonSalV2.SensorySettings('leonsal-v2-foundation-test');
      settings.set({ motion: true, reducedMotion: false, calmMode: false, sound: false, vibration: false });
      const motion = new LeonSalV2.MotionEngine(settings);

      const memory = new LeonSalV2.MemoryRecallEngine([{ pairId: 'a' }, { pairId: 'a' }]);
      const firstReveal = memory.reveal(0);
      const memoryMatch = memory.reveal(1);
      const memoryResetBefore = memory.complete();
      memory.reset();

      const physics = new LeonSalV2.PhysicsPlayEngine(motion, settings, { width: 120, height: 120 });
      const ball = physics.add({ x: 60, y: 60, radius: 12 });
      physics.applyForce(ball, { x: 10, y: -20 });
      physics.step(1 / 60);
      const physicsMoved = ball.y !== 60 || ball.x !== 60;
      physics.destroy();

      const assetLoader = new LeonSalV2.AssetLoaderEngine();
      const approvedSrc = assetLoader.resolve({ id: 'battery-empty', status: 'approved', webPath: 'assets/characters-v2/battery/empty/web.webp' });
      const blockedSrc = assetLoader.resolve({ id: 'zaya-review', status: 'pending-art', webPath: 'qa/example.png' });

      const img = document.createElement('img');
      const character = new LeonSalV2.CharacterStateAnimationEngine((id, state) => {
        if (id === 'battery-buddy' && state === 'excited') return { approved: true, src: 'assets/characters-v2/battery/excited/web.webp' };
        return null;
      }, settings);
      const characterApproved = character.set({ characterId: 'battery-buddy', state: 'excited', element: img });
      const approvedVisible = img.hidden === false;
      const characterPending = character.set({ characterId: 'zaya', state: 'calm', element: img });

      const shell = new LeonSalV2.WorldShellProgressEngine(['choose', 'play', 'finish']);
      shell.next();
      shell.next();
      const shellComplete = shell.complete();
      shell.finish();

      const profile = new LeonSalV2.ProfileProgressStoreEngine('leonsal-v2-foundation-test-progress');
      profile.setPreference('sound', false);
      profile.record('bubble-garden', { visits: 1 });
      profile.markFinished('bubble-garden');
      const profileOk = profile.value.preferences.sound === false && profile.value.progress['bubble-garden'].visits === 1 && profile.value.finished.includes('bubble-garden');
      profile.clear();

      const hints = new LeonSalV2.HintFeedbackEngine({ messages: { near: 'Try near the glow.' } });
      const hint = hints.hint('near');
      const success = hints.success('Finished.');

      const monitor = new LeonSalV2.PerformanceMonitorEngine(motion);
      monitor.start();
      motion.add(() => {});
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const performanceSummary = monitor.summary();
      monitor.stop();
      motion.stop();

      return {
        memory: { firstReveal: firstReveal.waiting, matched: memoryMatch.matched, completeBeforeReset: memoryResetBefore, completeAfterReset: memory.complete() },
        physicsMoved,
        assetLoader: { approvedSrc, blockedSrc },
        character: {
          approvedState: characterApproved.state,
          approvedVisible,
          pendingState: characterPending.state,
          pendingHidden: img.hidden === true,
          pendingSrc: img.getAttribute('src') || ''
        },
        shell: { shellComplete, finished: shell.finished },
        profileOk,
        hints: { hint: hint.message, success: success.message, history: hints.history.length },
        performanceSummary
      };
    });

    assert.equal(result.memory.firstReveal, true);
    assert.equal(result.memory.matched, true);
    assert.equal(result.memory.completeBeforeReset, true);
    assert.equal(result.memory.completeAfterReset, false);
    assert.equal(result.physicsMoved, true);
    assert.equal(result.assetLoader.approvedSrc, 'assets/characters-v2/battery/empty/web.webp');
    assert.equal(result.assetLoader.blockedSrc, null);
    assert.equal(result.character.approvedState, 'excited');
    assert.equal(result.character.approvedVisible, true);
    assert.equal(result.character.pendingState, 'calm');
    assert.equal(result.character.pendingHidden, true);
    assert.equal(result.character.pendingSrc, '');
    assert.equal(result.shell.shellComplete, true);
    assert.equal(result.shell.finished, true);
    assert.equal(result.profileOk, true);
    assert.equal(result.hints.hint, 'Try near the glow.');
    assert.equal(result.hints.success, 'Finished.');
    assert.equal(result.hints.history, 2);
    assert(result.performanceSummary.sampleCount > 0, 'Performance monitor did not sample frames');
    await fs.mkdir('qa/v2-foundation-engines', { recursive: true });
    await fs.writeFile('qa/v2-foundation-engines/results.json', JSON.stringify({ passed: true, result }, null, 2) + '\n');
    console.log('V2 foundation engine checks passed.');
  } finally {
    await browser.close();
    if (!externalBase && server.listening) await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  if (!externalBase && server.listening) server.close();
  console.error(error);
  process.exitCode = 1;
});
