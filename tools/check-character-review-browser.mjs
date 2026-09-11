import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
const root=process.cwd(), name=process.env.LEONSAL_TEST_BROWSER || 'chromium';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
 try { const bytes=await fs.readFile(file);res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes); }
 catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await ({chromium,webkit}[name]).launch();
const out=`qa/character-integration/${name}`;await fs.mkdir(out,{recursive:true});
const errors=[];
try {
 for(const width of [390,768,1280]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto(base+'/v2-home.html');
  await page.waitForSelector('[data-approved-character] img');
  assert.match(await page.locator('[data-approved-character] img').getAttribute('src'),/battery\/happy\/web.webp$/);
  for(const route of ['energy-battery','dash-dock','bubble-garden','light-trail','hold-to-breathe']) await page.goto(`${base}/v2-${route}.html`);
  assert(!requests.some(url=>/character-review|source-safe-keeping|_staging/.test(url)),'Review art leaked into gameplay');
  await page.goto(base+'/character-review.html');
  await page.waitForSelector('#characterImage:not([hidden])');
  assert(await page.getByText('Internal artwork review', {exact:false}).isVisible());
  for(const state of ['empty','low','calm','happy','excited']) {
   await page.locator(`[data-state="${state}"]`).filter({hasNot:page.locator('img')}).first().click();
   await page.waitForFunction(s=>{const img=document.querySelector('#characterImage');return !img.hidden && img.dataset.state===s && img.complete && img.naturalWidth===1254;},state);
   assert.equal(await page.locator(`button[data-state="${state}"]`).getAttribute('aria-pressed'),'true');
  }
  await page.locator('#energy').focus();await page.keyboard.press('Home');
  await page.waitForFunction(()=>document.querySelector('#characterImage').dataset.state==='empty');
  await page.locator('#darkBackground').check();assert(await page.locator('#reviewStage').evaluate(el=>el.classList.contains('dark')));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`${out}/review-${width}.png`,fullPage:true});
  await page.locator('summary').click();await page.waitForSelector('#referenceImages img');assert.equal(await page.locator('#referenceImages img').count(),2);
  await context.close();
 }
 const page=await browser.newPage();
 await page.route('**/assets/character-review/elephant/low.webp',route=>route.abort());
 await page.goto(base+'/character-review.html');await page.waitForSelector('#characterImage:not([hidden])');
 await page.getByRole('button',{name:'Low',exact:true}).click();
 await page.getByText('This pose could not load.',{exact:false}).waitFor();
 assert(await page.locator('#characterImage').isHidden());
 await page.getByRole('button',{name:'Calm',exact:true}).click();await page.waitForSelector('#characterImage:not([hidden])');
 await page.route('**/data/character-assets.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({world:[{id:'battery-buddy',status:'pending-art',states:{happy:'assets/character-review/elephant/happy.webp'}}]})}));
 await page.goto(base+'/v2-home.html');await page.waitForLoadState('networkidle');assert.equal(await page.locator('[data-approved-character] img').count(),0);assert(await page.locator('.home-battery').isVisible());
 assert.deepEqual(errors,[]);await fs.writeFile(`${out}/results.json`,JSON.stringify({passed:true,browser:name,widths:[390,768,1280],checks:['approved-only home','no review gameplay requests','five poses','keyboard','dark background','references','network failure recovery','pending record fallback'],errors},null,2)+'\n');
 console.log(`${name}: character integration checks passed`);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
