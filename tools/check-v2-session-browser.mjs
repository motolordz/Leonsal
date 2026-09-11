import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
const browserName = process.env.LEONSAL_TEST_BROWSER || 'chromium';
if (!['chromium', 'webkit'].includes(browserName)) throw new Error('Unsupported test browser');

const root = process.cwd();
const out = path.join(root, 'qa/session-completion', browserName);
await fs.mkdir(out, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp' };
const server = http.createServer(async (req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try { res.writeHead(200, {'content-type': mime[path.extname(file)] || 'application/octet-stream'}).end(await fs.readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await ({chromium,webkit}[browserName]).launch();
const failures = [];
const results = [];
try {
  for (const viewport of [{width:390,height:844}, {width:768,height:1024}, {width:1280,height:800}]) {
    const context = await browser.newContext({viewport});
    const page = await context.newPage();
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if(response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(base+'/v2-home.html');
    assert.equal(await page.locator('.world-game').count(), 5);
    await page.screenshot({path:path.join(out,`home-${viewport.width}.png`),fullPage:true});
    for (const route of ['energy-battery','dash-dock','bubble-garden','light-trail','hold-to-breathe']) {
      await page.goto(`${base}/v2-${route}.html`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: horizontal overflow`);
      await page.getByRole('button',{name:'Pause',exact:true}).click();
      assert(await page.locator('.session-dialog').isVisible());
      assert(await page.locator('.game-scene').evaluate(el=>el.inert));
      if(route!=='energy-battery') assert.equal(await page.evaluate(()=>motion.frame),0);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.game-scene').evaluate(el=>el.inert),false);
      await page.getByRole('button',{name:'Finished',exact:true}).click();
      await page.getByRole('button',{name:'Start again',exact:true}).last().click();
      await page.getByRole('button',{name:'Sensory settings',exact:true}).click();
      const sound = page.locator('#settings [data-key="sound"]');
      await sound.focus(); await page.keyboard.press('Enter');
      assert.equal(await sound.getAttribute('aria-pressed'),'true');
      assert(await sound.evaluate(el=>document.activeElement===el),'Settings lost keyboard focus');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#settingsToggle').getAttribute('aria-expanded'),'false');
      await page.screenshot({path:path.join(out,`${route}-${viewport.width}.png`),fullPage:true});
    }
    await page.goto(base+'/v2-dash-dock.html');
    // Real button presses must travel once, never also activate the scene.
    await page.getByRole('button',{name:'Move right',exact:true}).click();
    await page.waitForTimeout(450);
    let dash=await page.evaluate(()=>window.__dashDockState());
    assert(Math.abs(dash.dashPosition-18)<.01); assert.equal(dash.energy,0);
    await page.evaluate(()=>window.__dashDockSetPosition(100));
    await page.waitForTimeout(220);
    await page.getByRole('button',{name:'Pause',exact:true}).click();
    const before=await page.evaluate(()=>window.__dashDockState().energy);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>window.__dashDockState().energy),before);
    await page.getByRole('button',{name:'Keep playing',exact:true}).click();
    await page.waitForTimeout(80);
    assert((await page.evaluate(()=>window.__dashDockState().energy))-before<20,'Resume jumped over paused time');
    await page.waitForFunction(()=>window.__dashDockState().charged);
    await page.getByRole('button',{name:'Start again',exact:true}).click();
    dash=await page.evaluate(()=>window.__dashDockState());
    assert.equal(dash.dashPosition,0);assert.equal(dash.energy,0);
    await page.goto(base+'/v2-bubble-garden.html');
    assert.equal(await page.evaluate(()=>particles.items.length),28,'Density overwritten on start');
    await page.getByRole('button',{name:'Pop a bubble',exact:true}).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>particles.items.filter(x=>x.type==='bubbles').length),27);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert.equal(await page.evaluate(()=>particles.items.length),6);
    await page.goto(base+'/v2-light-trail.html');
    await page.locator('#canvas').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
    assert((await page.evaluate(()=>trail.points.length))>1);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    await page.evaluate(()=>settings.set({motion:true,reducedMotion:false}));
    assert.equal(await page.evaluate(()=>settings.allowsMotion()),false);
    await page.goto(base+'/v2-hold-to-breathe.html');
    await page.getByRole('button',{name:'Expand',exact:true}).focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>scale),1.55);
    await page.getByRole('button',{name:'Settle',exact:true}).click();
    assert.equal(await page.evaluate(()=>scale),1);
    results.push({viewport,passed:true,coverage:['navigation','pause-finish-resume','settings-keyboard-focus','dash-lifecycle','bubble-keyboard-density','trail-keyboard','OS-reduced-motion','breathing-keyboard']});
    await context.close();
  }
  assert.deepEqual(failures,[]);
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({browser:browserName,passed:true,results,errors:failures},null,2)+'\n');
  console.log(`${browserName}: V2 session browser checks passed at phone, tablet and desktop sizes.`);
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
