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
const externalBase = process.env.LEONSAL_BASE_URL?.replace(/\/$/, '');
if (!externalBase) {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
}
const base = externalBase || `http://127.0.0.1:${server.address().port}`;
const browser = await ({chromium,webkit}[browserName]).launch();
const failures = [];
const results = [];
const playableRoutes = [
  'energy-battery',
  'dash-dock',
  'bubble-garden',
  'firefly-catch',
  'calm-rain-window',
  'snow-globe',
  'star-shower',
  'growing-garden',
  'number-merge',
  'alphabet-adventure',
  'shape-builder',
  'letter-tracing',
  'number-tracing',
  'shape-tracing',
  'colour-match',
  'big-small',
  'pattern-builder',
  'sort-it',
  'planet-pals',
  'build-solar-system',
  'day-night',
  'days-week',
  'months-year',
  'seasons',
  'first-clock',
  'weather-world',
  'animal-habitats',
  'transport-adventure',
  'double-decker-bus',
  'light-trail',
  'hold-to-breathe',
  'trace-engine',
  'orbit-engine',
  'cause-effect-engine'
];
try {
  for (const viewport of [{width:390,height:844}, {width:768,height:1024}, {width:1280,height:800}]) {
    const context = await browser.newContext({viewport});
    const page = await context.newPage();
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if(response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(base+'/v2-home.html');
    assert.equal(await page.locator('.hub-game-grid .world-game').count(), 10);
    assert.equal(await page.locator('.hub-engine-grid .world-game').count(), 24);
    assert((await page.locator('.world-game .game-art[data-character-decorated="true"] .procedural-character-svg').count()) >= 30, 'V2 home activity cards must render procedural character art');
    assert.equal(await page.locator('.landing-runner[data-svg-guide="true"] .home-guide-svg').count(), 2);
    assert.equal(await page.locator('[data-home-play]').count(), 4);
    await page.locator('[data-home-play="hoops"]').click();
    assert.equal(await page.locator('.hub-art').getAttribute('data-home-play-mode'), 'hoops');
    await page.locator('[data-home-play="hopscotch"]').click();
    assert.equal(await page.locator('.hub-art').getAttribute('data-home-play-mode'), 'hopscotch');
    await page.locator('[data-home-play="calm"]').click();
    assert.equal(await page.evaluate(() => window.__v2HomeProofState().playMode), 'calm');
    assert.equal(await page.locator('.need-card').count(), 5);
    assert.equal(await page.locator('.bus-need').getAttribute('href'), 'v2-double-decker-bus.html');
    await page.screenshot({path:path.join(out,`home-${viewport.width}.png`),fullPage:true});
    await page.goto(base+'/v2-character-world.html');
    await page.waitForFunction(() => document.querySelectorAll('.character-world-card').length >= 60);
    assert.equal(await page.locator('.state-picker button').count(), 5);
    assert.equal(await page.locator('.play-mode-picker button').count(), 4);
    const expectedCharacterBodies = [
      ['battery-buddy', '.battery-body'],
      ['world-dinosaur', '.dinosaur-body'],
      ['world-earth', '.earth-body'],
      ['world-robot', '.robot-body'],
      ['world-magnifier', '.magnifier-body'],
      ['world-puzzle', '.puzzle-body'],
      ['world-train', '.train-body'],
      ['double-decker', '.vehicle-body'],
      ['plane', '.plane-body'],
      ['boat', '.boat-body'],
      ['planet-sun', '.planet-sun-body'],
      ['planet-mercury', '.planet-mercury-body'],
      ['planet-venus', '.planet-venus-body'],
      ['planet-mars', '.planet-mars-body'],
      ['planet-jupiter', '.planet-jupiter-body'],
      ['planet-saturn', '.planet-saturn-body'],
      ['planet-uranus', '.planet-uranus-body'],
      ['planet-neptune', '.planet-neptune-body']
    ];
    for (const [characterId, bodySelector] of expectedCharacterBodies) {
      assert.equal(
        await page.locator(`.character-world-card[data-character="${characterId}"] ${bodySelector}`).count(),
        1,
        `Character World ${characterId} must render ${bodySelector}`
      );
    }
    assert((await page.locator('.character-runtime-truth').innerText()).includes('approved runtime states'), 'Character World runtime truth missing approved count');
    assert((await page.locator('.character-runtime-truth').innerText()).includes('pending review states'), 'Character World runtime truth missing pending count');
    await page.locator('[data-family-filter="alphabet"]').click();
    assert.equal(await page.locator('.character-world-card[data-family="alphabet"]').count(), 26);
    await page.locator('[data-family-filter="guide"]').click();
    assert.equal(await page.locator('.character-world-card[data-family="guide"]').count(), 2);
    await page.locator('[data-play-mode="football"]').click();
    assert.equal(await page.locator('.character-chase-scene').getAttribute('data-play-mode'), 'football');
    await page.locator('.state-picker [data-state="excited"]').click();
    assert((await page.locator('#selectedCharacterCard .character-state-excited').count()) >= 1, 'Character World state picker did not render excited state');
    await page.screenshot({path:path.join(out,`character-world-${viewport.width}.png`),fullPage:true});
    for (const route of playableRoutes) {
      await page.goto(`${base}/v2-${route}.html`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: horizontal overflow`);
      await page.getByRole('button',{name:'Pause',exact:true}).click();
      assert(await page.locator('.session-dialog').isVisible());
      assert(await page.locator('.game-scene').evaluate(el=>el.inert));
      assert.equal(await page.locator('body').getAttribute('data-paused'),'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.game-scene').evaluate(el=>el.inert),false);
      assert.equal(await page.locator('body').getAttribute('data-paused'),'false');
      await page.getByRole('button',{name:'Finished',exact:true}).click();
      await page.locator('.session-dialog [data-repeat]').click();
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
    assert.equal(await page.evaluate(()=>window.__bubbleGardenProofState().hasCharacterRenderer),true);
    assert.equal(await page.evaluate(()=>particles.items.length),28,'Density overwritten on start');
    await page.getByRole('button',{name:'Pop a bubble',exact:true}).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>particles.items.filter(x=>x.type==='bubbles').length),27);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert.equal(await page.evaluate(()=>particles.items.length),6);
    await page.goto(base+'/v2-firefly-catch.html');
    assert.equal(await page.evaluate(()=>window.__fireflyProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Glow one',exact:true}).click();
    assert((await page.evaluate(()=>window.__fireflyProofState().glows))>0);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__fireflyProofState().fireflies))<=6);
    await page.goto(base+'/v2-calm-rain-window.html');
    assert.equal(await page.evaluate(()=>window.__rainProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Ripple',exact:true}).click();
    assert((await page.evaluate(()=>window.__rainProofState().ripples))>0);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__rainProofState().drops))<=28);
    await page.goto(base+'/v2-snow-globe.html');
    assert.equal(await page.evaluate(()=>window.__snowGlobeProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Shake gently',exact:true}).click();
    assert((await page.evaluate(()=>window.__snowGlobeProofState().energy))>0);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__snowGlobeProofState().flakes))<=32);
    await page.goto(base+'/v2-star-shower.html');
    assert.equal(await page.evaluate(()=>window.__starShowerProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Soft star',exact:true}).click();
    assert((await page.evaluate(()=>window.__starShowerProofState().stars))>0);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__starShowerProofState().maxStars))<=5);
    await page.goto(base+'/v2-growing-garden.html');
    assert.equal(await page.evaluate(()=>window.__growingGardenProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Water',exact:true}).click();
    assert((await page.evaluate(()=>window.__growingGardenProofState().grown))>0);
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__growingGardenProofState().plants))<=3);
    await page.goto(base+'/v2-number-merge.html');
    assert((await page.locator('.number-buddy .procedural-character-svg').count())>=5);
    await page.locator('.number-buddy').nth(0).click();
    await page.locator('.number-buddy').nth(1).click();
    assert((await page.locator('.number-result .procedural-character-svg.character-state-excited').count())===1);
    assert.equal(await page.evaluate(()=>{const state=window.__numberMergeProofState();return state.result===state.selected[0]+state.selected[1];}),true);
    await page.getByRole('button',{name:'Clear',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__numberMergeProofState().result),null);
    await page.goto(base+'/v2-alphabet-adventure.html');
    assert.equal(await page.locator('.big-letter .procedural-character-svg.character-family-alphabet').count(),1);
    assert.equal(await page.locator('.letter-chip').count(),26);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__alphabetAdventureProofState().letter),'B');
    await page.locator('.letter-chip').last().click();
    assert.equal(await page.evaluate(()=>window.__alphabetAdventureProofState().letter),'Z');
    await page.goto(base+'/v2-shape-builder.html');
    assert.equal(await page.evaluate(()=>window.__shapeBuilderProofState().hasCharacterRenderer),true);
    for (let i=0;i<4;i+=1) await page.locator('.shape-piece').nth(i).click();
    assert.equal(await page.evaluate(()=>window.__shapeBuilderProofState().complete),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__shapeBuilderProofState().placed.length),0);
    await page.goto(base+'/v2-letter-tracing.html');
    assert.equal(await page.locator('.trace-character-preview .procedural-character-svg.character-family-alphabet').count(),1);
    assert.equal(await page.evaluate(()=>window.__letterTracingProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Step',exact:true}).click();
    assert((await page.evaluate(()=>window.__letterTracingProofState().progress))>0);
    assert.notEqual(await page.evaluate(()=>window.__letterTracingProofState().characterState),'empty');
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__letterTracingProofState().letter),'M');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__letterTracingProofState().progress),0);
    await page.goto(base+'/v2-number-tracing.html');
    assert.equal(await page.locator('.trace-character-preview .procedural-character-svg.character-family-number').count(),1);
    assert.equal(await page.evaluate(()=>window.__numberTracingProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Step',exact:true}).click();
    assert((await page.evaluate(()=>window.__numberTracingProofState().progress))>0);
    assert.notEqual(await page.evaluate(()=>window.__numberTracingProofState().characterState),'empty');
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__numberTracingProofState().number),'2');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__numberTracingProofState().progress),0);
    await page.goto(base+'/v2-shape-tracing.html');
    assert.equal(await page.evaluate(()=>window.__shapeTracingProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Step',exact:true}).click();
    assert((await page.evaluate(()=>window.__shapeTracingProofState().progress))>0);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__shapeTracingProofState().shape),'triangle');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__shapeTracingProofState().progress),0);
    await page.goto(base+'/v2-colour-match.html');
    assert.equal(await page.evaluate(()=>window.__colourMatchProofState().hasCharacterRenderer),true);
    await page.locator('.colour-drop').first().click();
    await page.locator('.colour-well').first().click();
    assert.equal(await page.evaluate(()=>window.__colourMatchProofState().matched.includes('red')),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__colourMatchProofState().matched.length),0);
    await page.goto(base+'/v2-big-small.html');
    assert.equal(await page.evaluate(()=>window.__bigSmallProofState().hasCharacterRenderer),true);
    await page.locator('.size-toy').first().click();
    await page.locator('.size-basket').first().click();
    assert.equal(await page.evaluate(()=>window.__bigSmallProofState().sorted.includes('tiny-star')),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__bigSmallProofState().sorted.length),0);
    await page.goto(base+'/v2-pattern-builder.html');
    assert.equal(await page.evaluate(()=>window.__patternBuilderProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Add next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__patternBuilderProofState().placed.length),3);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__patternBuilderProofState().placed.length),2);
    await page.goto(base+'/v2-sort-it.html');
    assert.equal(await page.evaluate(()=>window.__sortItProofState().hasCharacterRenderer),true);
    await page.locator('.sort-item').first().click();
    await page.locator('.sort-basket').first().click();
    assert.equal(await page.evaluate(()=>window.__sortItProofState().sorted.includes('cloud')),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__sortItProofState().sorted.length),0);
    await page.goto(base+'/v2-planet-pals.html');
    assert.equal(await page.evaluate(()=>window.__planetPalsProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__planetPalsProofState().visited.includes('Mercury')),true);
    assert.equal(await page.evaluate(()=>window.__planetPalsProofState().educationalScaleNote),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__planetPalsProofState().visited.length),0);
    await page.goto(base+'/v2-build-solar-system.html');
    assert.equal(await page.evaluate(()=>window.__solarBuildProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Place next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__solarBuildProofState().placed.includes('mercury')),true);
    assert.equal(await page.evaluate(()=>window.__solarBuildProofState().educationalScaleNote),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__solarBuildProofState().placed.length),0);
    await page.goto(base+'/v2-day-night.html');
    assert.equal(await page.evaluate(()=>window.__dayNightProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__dayNightProofState().phase),'day');
    assert.equal(await page.evaluate(()=>window.__dayNightProofState().cycleNote),true);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__dayNightProofState().phase),'morning');
    await page.goto(base+'/v2-days-week.html');
    await page.getByRole('button',{name:'Next day',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__daysWeekProofState().day),'Tuesday');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__daysWeekProofState().day),'Monday');
    await page.goto(base+'/v2-months-year.html');
    await page.getByRole('button',{name:'Next month',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__monthsYearProofState().month),'February');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__monthsYearProofState().month),'January');
    await page.goto(base+'/v2-seasons.html');
    assert.equal(await page.evaluate(()=>window.__seasonsProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Next season',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__seasonsProofState().season),'Summer');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__seasonsProofState().season),'Spring');
    await page.goto(base+'/v2-first-clock.html');
    await page.getByRole('button',{name:'Next hour',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__firstClockProofState().readout),'2:00');
    await page.getByRole('button',{name:'Half hour',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__firstClockProofState().readout),'2:30');
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__firstClockProofState().readout),'1:00');
    await page.goto(base+'/v2-weather-world.html');
    assert.equal(await page.evaluate(()=>window.__weatherWorldProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Next weather',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__weatherWorldProofState().weather),'Cloudy');
    await page.getByRole('button',{name:'Choose Snow',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__weatherWorldProofState().weather),'Snow');
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__weatherWorldProofState().particles))<=10);
    await page.goto(base+'/v2-animal-habitats.html');
    assert.equal(await page.evaluate(()=>window.__animalHabitatsProofState().hasCharacterRenderer),true);
    await page.locator('.animal-token[data-id="owl"]').click();
    await page.locator('.habitat-zone[data-habitat="forest"]').click();
    assert((await page.evaluate(()=>window.__animalHabitatsProofState().matched)).includes('owl'));
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal((await page.evaluate(()=>window.__animalHabitatsProofState().matched.length)),0);
    await page.goto(base+'/v2-transport-adventure.html');
    assert.equal(await page.evaluate(()=>window.__transportAdventureProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Choose Water',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__transportAdventureProofState().route),'Water');
    await page.evaluate(()=>settings.set({reducedMotion:true}));
    await page.getByRole('button',{name:'Go',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__transportAdventureProofState().progress),100);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__transportAdventureProofState().progress),0);
    await page.goto(base+'/v2-double-decker-bus.html');
    assert.equal(await page.evaluate(()=>window.__doubleDeckerBusProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Hong Kong Bus',exact:true}).click();
    await page.getByRole('button',{name:'Super speed',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__doubleDeckerBusProofState().bus),'hong-kong');
    assert.equal(await page.evaluate(()=>window.__doubleDeckerBusProofState().speed),'super-speed');
    await page.evaluate(()=>settings.set({calmMode:true}));
    assert((await page.evaluate(()=>window.__doubleDeckerBusProofState().effectiveSpeed))<=18);
    await page.goto(base+'/v2-light-trail.html');
    assert.equal(await page.evaluate(()=>window.__lightTrailProofState().hasCharacterRenderer),true);
    await page.locator('#canvas').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
    assert((await page.evaluate(()=>trail.points.length))>1);
    assert.equal(await page.evaluate(()=>window.__lightTrailProofState().hasCharacterRenderer),true);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    await page.evaluate(()=>settings.set({motion:true,reducedMotion:false}));
    assert.equal(await page.evaluate(()=>settings.allowsMotion()),false);
    await page.goto(base+'/v2-hold-to-breathe.html');
    assert.equal(await page.evaluate(()=>window.__holdToBreatheProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Expand',exact:true}).focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>scale),1.55);
    assert.equal(await page.evaluate(()=>window.__holdToBreatheProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Settle',exact:true}).click();
    assert.equal(await page.evaluate(()=>scale),1);
    await page.goto(base+'/v2-trace-engine.html');
    assert.equal(await page.evaluate(()=>window.__traceProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Step',exact:true}).click();
    assert((await page.evaluate(()=>window.__traceProofState().progress))>0);
    await page.goto(base+'/v2-orbit-engine.html');
    assert.equal(await page.evaluate(()=>window.__orbitProofState().hasCharacterRenderer),true);
    assert.equal(await page.evaluate(()=>window.__orbitProofState().educationalScaleNote),true);
    await page.goto(base+'/v2-cause-effect-engine.html');
    assert.equal(await page.evaluate(()=>window.__causeEffectProofState().hasCharacterRenderer),true);
    await page.getByRole('button',{name:'Light',exact:true}).click();
    await page.getByRole('button',{name:'Grow',exact:true}).click();
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__causeEffectProofState().deterministicReset),true);
    results.push({viewport,passed:true,coverage:['navigation','need-picker','pause-finish-resume-all-routes','settings-keyboard-focus','dash-lifecycle','bubble-keyboard-density','trail-keyboard','OS-reduced-motion','breathing-keyboard','trace-step-alternative','orbit-educational-scale-note','cause-effect-reset']});
    await context.close();
  }
  assert.deepEqual(failures,[]);
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({browser:browserName,passed:true,results,errors:failures},null,2)+'\n');
  console.log(`${browserName}: V2 session browser checks passed at phone, tablet and desktop sizes.`);
} finally {
  await browser.close();
  if (!externalBase) await new Promise(resolve=>server.close(resolve));
}
