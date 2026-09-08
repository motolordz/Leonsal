import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = process.cwd();
const outDir = path.join(root, "qa/battery-production-v3/mobile");
const reportPath = path.join(root, "qa/battery-production-v3/browser-proof.json");
const failures = [];
const proof = {
  viewport: "390x844",
  screenshots: [],
  states: [],
  performance: {}
};

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`console error: ${message.text()}`);
});
page.on("pageerror", (error) => failures.push(`page error: ${error.message}`));

await page.goto(pathToFileURL(path.join(root, "v2-energy-battery.html")).href, { waitUntil: "load" });

for (const value of [0, 25, 50, 75, 100]) {
  const state = await page.evaluate((energy) => {
    window.drawBattery(energy);
    const svg = document.querySelector("#batterySvg");
    const fill = document.querySelector("[data-fill]");
    const left = document.querySelector('[data-eye="left"]');
    const right = document.querySelector('[data-eye="right"]');
    const mouth = document.querySelector("[data-face]");
    const read = (element, attr) => Number(element.getAttribute(attr));
    return {
      energy,
      canonicalState: svg.dataset.energyState,
      status: document.querySelector("#status").textContent,
      fillWidth: read(fill, "width"),
      fillColor: fill.getAttribute("fill"),
      leftEye: { cx: read(left, "cx"), cy: read(left, "cy"), r: read(left, "r") },
      rightEye: { cx: read(right, "cx"), cy: read(right, "cy"), r: read(right, "r") },
      mouth: mouth.getAttribute("d"),
      sceneHeight: Math.round(document.querySelector("#scene").getBoundingClientRect().height)
    };
  }, value);
  const expected = value === 0 ? "empty" : value === 25 ? "low" : value === 50 ? "calm" : value === 75 ? "happy" : "excited";
  if (state.canonicalState !== expected) failures.push(`${value}% expected ${expected}, got ${state.canonicalState}`);
  if (!state.status.toLowerCase().includes(expected === "empty" ? "empty" : expected === "excited" ? "full" : expected)) {
    failures.push(`${value}% status text does not match ${expected}: ${state.status}`);
  }
  if (Math.abs((state.leftEye.cx + state.rightEye.cx) / 2 - 199) > 0.01) failures.push(`${value}% face eye center drifted`);
  if (!state.mouth.includes("Q199")) failures.push(`${value}% mouth is not centered on body centerline`);
  const file = path.join(outDir, `battery-${value}.png`);
  await page.screenshot({ path: file, fullPage: false });
  proof.screenshots.push(path.relative(root, file));
  proof.states.push(state);
}

proof.performance = await page.evaluate(async () => {
  const samples = [];
  let last = performance.now();
  let value = 0;
  return await new Promise((resolve) => {
    const tick = (now) => {
      const fps = 1000 / Math.max(1, now - last);
      samples.push(fps);
      last = now;
      value = Math.min(100, value + 1.2);
      window.drawBattery(value);
      if (value < 100) {
        requestAnimationFrame(tick);
        return;
      }
      const sorted = [...samples].sort((a, b) => a - b);
      resolve({
        frames: samples.length,
        averageFps: Number((samples.reduce((sum, fps) => sum + fps, 0) / samples.length).toFixed(1)),
        worstObservedFps: Number(sorted[0].toFixed(1)),
        fifthPercentileFps: Number(sorted[Math.floor(sorted.length * 0.05)].toFixed(1))
      });
    };
    requestAnimationFrame(tick);
  });
});

await browser.close();

proof.failures = failures;
await fs.writeFile(reportPath, JSON.stringify(proof, null, 2));

if (failures.length) {
  console.error("Battery production v3 browser audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Battery production v3 browser audit passed. Average FPS ${proof.performance.averageFps}; worst observed FPS ${proof.performance.worstObservedFps}.`);
