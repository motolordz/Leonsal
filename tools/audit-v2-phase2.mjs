import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";

const root = process.cwd();
const outDir = path.join(root, "qa/bat-face-001");
const failures = [];
const proof = {
  viewport: "390x844",
  battery: [],
  dash: {},
  trace: {},
  orbit: {},
  causeEffect: {}
};

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`console error: ${message.text()}`);
});
page.on("pageerror", (error) => failures.push(`page error: ${error.message}`));

const open = async (file) => page.goto(pathToFileURL(path.join(root, file)).href, { waitUntil: "load" });

await open("v2-energy-battery.html");
for (const energy of [0, 25, 50, 75, 100]) {
  const state = await page.evaluate((value) => {
    window.drawBattery(value);
    const left = document.querySelector('[data-eye="left"]');
    const right = document.querySelector('[data-eye="right"]');
    const mouth = document.querySelector("[data-face]");
    const svg = document.querySelector("#batterySvg");
    const read = (el, attr) => Number(el.getAttribute(attr));
    return {
      energy: value,
      state: svg.dataset.energyState,
      label: document.querySelector("#status").textContent,
      leftEye: { cx: read(left, "cx"), cy: read(left, "cy"), r: read(left, "r") },
      rightEye: { cx: read(right, "cx"), cy: read(right, "cy"), r: read(right, "r") },
      mouth: mouth.getAttribute("d")
    };
  }, energy);
  const bodyCenter = 52 + 294 / 2;
  if (Math.abs(((state.leftEye.cx + state.rightEye.cx) / 2) - bodyCenter) > 0.01) failures.push(`Battery ${energy}: eye center drift`);
  if (Math.abs((bodyCenter - state.leftEye.cx) - (state.rightEye.cx - bodyCenter)) > 0.01) failures.push(`Battery ${energy}: eye symmetry drift`);
  if (Math.abs(state.leftEye.cy - state.rightEye.cy) > 0.01) failures.push(`Battery ${energy}: vertical eye mismatch`);
  if (!state.mouth.includes(`Q${bodyCenter}`)) failures.push(`Battery ${energy}: mouth is not body-centered`);
  const clip = await page.locator("#batterySvg").screenshot();
  const file = path.join(outDir, `battery-${energy}.png`);
  await fs.writeFile(file, clip);
  proof.battery.push({ ...state, screenshot: path.relative(root, file) });
}

const tiles = await Promise.all([0, 25, 50, 75, 100].map(async (energy) => {
  const input = path.join(outDir, `battery-${energy}.png`);
  return sharp(input)
    .resize({ width: 320, height: 300, fit: "contain", background: "#f7fbff", withoutEnlargement: true })
    .extend({ top: 54, bottom: 22, left: 12, right: 12, background: "#f7fbff" })
    .composite([{ input: Buffer.from(`<svg width="344" height="54"><text x="172" y="34" text-anchor="middle" font-size="28" font-family="Arial" font-weight="800" fill="#132343">${energy}%</text></svg>`), top: 0, left: 0 }])
    .png()
    .toBuffer();
}));
await sharp({
  create: { width: 344 * 5, height: 376, channels: 4, background: "#eef7ff" }
})
  .composite(tiles.map((input, index) => ({ input, left: index * 344, top: 0 })))
  .png()
  .toFile(path.join(outDir, "battery-face-five-states.png"));

await open("v2-dash-dock.html");
proof.dash.start = await page.evaluate(() => window.__dashDockState());
await page.evaluate(() => window.__dashDockSetPosition(50));
await page.waitForTimeout(80);
proof.dash.travel = await page.evaluate(() => window.__dashDockState());
await page.evaluate(() => window.__dashDockSetPosition(100));
await page.waitForTimeout(2600);
proof.dash.full = await page.evaluate(() => window.__dashDockState());
await page.evaluate(() => window.__dashDockReset());
await page.waitForTimeout(80);
proof.dash.reset = await page.evaluate(() => window.__dashDockState());
await page.evaluate(() => window.__dashDockSetPosition(100));
await page.waitForTimeout(250);
await page.evaluate(() => window.__dashDockReset());
await page.waitForTimeout(2300);
proof.dash.resetDuringCharge = await page.evaluate(() => window.__dashDockState());
if (proof.dash.start.dashPosition !== 0 || proof.dash.start.energy !== 0 || proof.dash.start.state !== "empty") failures.push("Dash start invariant failed");
if (!(proof.dash.travel.dashPosition > 0) || proof.dash.travel.energy !== 0 || proof.dash.travel.state !== "empty") failures.push("Dash travel-before-dock invariant failed");
if (proof.dash.full.energy !== 100 || proof.dash.full.state !== "excited" || proof.dash.full.helperActive !== "true") failures.push("Dash full-charge invariant failed");
if (proof.dash.reset.dashPosition !== 0 || proof.dash.reset.energy !== 0 || proof.dash.reset.state !== "empty") failures.push("Dash reset invariant failed");
if (proof.dash.resetDuringCharge.energy !== 0 || proof.dash.resetDuringCharge.charging !== false || proof.dash.resetDuringCharge.state !== "empty") failures.push("Dash reset must cancel old charging callback");

await open("v2-trace-engine.html");
await page.locator("#step").click();
proof.trace.afterStep = await page.evaluate(() => window.__traceProofState());
await page.evaluate(() => { window.__traceProofCleanup(); return true; });
proof.trace.afterCleanup = "cleanup-called";
if (!proof.trace.afterStep.hasTapAlternative || proof.trace.afterStep.progress < 1) failures.push("Trace tap/non-drag alternative failed");

await open("v2-orbit-engine.html");
proof.orbit.start = await page.evaluate(() => window.__orbitProofState());
await page.locator('[data-speed="1.8"]').click();
proof.orbit.fast = await page.evaluate(() => window.__orbitProofState());
await page.evaluate(() => { window.__orbitProofCleanup(); return true; });
proof.orbit.afterCleanup = "cleanup-called";
if (!proof.orbit.start.educationalScaleNote) failures.push("Orbit proof lacks simplified-scale note");
if (proof.orbit.fast.speedScale !== 1.8) failures.push("Orbit speed control failed");

await open("v2-cause-effect-engine.html");
await page.locator('[data-cause="light"]').click();
await page.locator('[data-cause="grow"]').click();
proof.causeEffect.active = await page.evaluate(() => window.__causeEffectProofState());
await page.locator('[data-cause="reset"]').click();
proof.causeEffect.reset = await page.evaluate(() => window.__causeEffectProofState());
await page.evaluate(() => { window.__causeEffectProofCleanup(); return true; });
proof.causeEffect.afterCleanup = await page.evaluate(() => window.__causeEffectProofState());
if (proof.causeEffect.active.light !== "true" || proof.causeEffect.active.grow !== "true") failures.push("Cause/Effect trigger chain failed");
if (proof.causeEffect.reset.light !== "false" || proof.causeEffect.reset.grow !== "false") failures.push("Cause/Effect deterministic reset failed");
if (proof.causeEffect.afterCleanup.registeredEffects !== 0) failures.push("Cause/Effect cleanup failed");

await browser.close();

proof.failures = failures;
await fs.writeFile(path.join(outDir, "phase2-audit-proof.json"), JSON.stringify(proof, null, 2));

if (failures.length) {
  console.error("V2 phase-two browser audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V2 phase-two browser audit passed. Battery contact sheet: qa/bat-face-001/battery-face-five-states.png");
