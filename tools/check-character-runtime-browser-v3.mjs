import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const states = [
  { value: 0, state: "empty" },
  { value: 25, state: "low" },
  { value: 50, state: "calm" },
  { value: 75, state: "happy" },
  { value: 100, state: "excited" }
];
const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 }
];
const outDir = path.join(root, "qa/character-production-v3/RUNTIME-BROWSER");

function contentType(file) {
  if (file.endsWith(".html")) return "text/html";
  if (file.endsWith(".js")) return "text/javascript";
  if (file.endsWith(".css")) return "text/css";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function createServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath === "/" ? "index.html" : safePath);
    if (!filePath.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(buffer);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function setEnergy(page, value) {
  await page.locator("#energySlider").evaluate((slider, nextValue) => {
    slider.value = String(nextValue);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function selectCharacter(page, id) {
  if (id.startsWith("letter-")) {
    const letter = id.replace("letter-", "").toUpperCase();
    await page.locator(`#glyphPack .glyph-choice`, { hasText: letter }).click();
    return;
  }
  if (id.startsWith("number-")) {
    const number = id.replace("number-", "");
    await page.locator(`#glyphPack .glyph-choice`, { hasText: number }).click();
    return;
  }
  await page.locator(`.character-choice[data-character="${id}"]`).click();
}

async function assertBattery(page, value, state) {
  await selectCharacter(page, "battery");
  await setEnergy(page, value);
  await page.waitForFunction((expected) => document.querySelector("#characterStage")?.dataset.energyState === expected, state);
  await page.waitForFunction((expected) => {
    const img = document.querySelector("#energyCharacterImage");
    return img && !img.hidden && (img.getAttribute("src") || "").includes(expected) && img.naturalWidth > 0;
  }, `assets/characters-v2/battery/${state}/web.webp`);
  const result = await page.locator("#energyCharacterImage").evaluate((img) => ({
    hidden: img.hidden,
    src: img.getAttribute("src") || "",
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    rect: img.getBoundingClientRect().toJSON(),
    stage: document.querySelector("#characterStage")?.dataset,
    fallbackGlyphHidden: document.querySelector("#glyphCharacter")?.hidden,
    fallbackSpriteHidden: document.querySelector("#worldSprite")?.hidden
  }));
  if (result.hidden) throw new Error(`Battery ${value}% image is hidden`);
  if (!result.src.includes(`assets/characters-v2/battery/${state}/web.webp`)) throw new Error(`Battery ${value}% uses wrong source: ${result.src}`);
  if (result.naturalWidth <= 0 || result.naturalHeight <= 0) throw new Error(`Battery ${value}% image did not decode`);
  if (result.rect.width < 80 || result.rect.height < 80) throw new Error(`Battery ${value}% image is not visibly rendered`);
  if (result.stage.characterId !== "battery-buddy" || result.stage.energyState !== state) throw new Error(`Battery ${value}% dataset mismatch`);
  if (!result.fallbackGlyphHidden || !result.fallbackSpriteHidden) throw new Error(`Battery ${value}% left fallback visible behind approved art`);
}

async function assertPendingFallback(page, id, value = 50) {
  await selectCharacter(page, id);
  await setEnergy(page, value);
  await page.waitForTimeout(120);
  const result = await page.evaluate(() => ({
    imageHidden: document.querySelector("#energyCharacterImage")?.hidden,
    imageSrc: document.querySelector("#energyCharacterImage")?.getAttribute("src") || "",
    characterId: document.querySelector("#characterStage")?.dataset.characterId,
    energyState: document.querySelector("#characterStage")?.dataset.energyState,
    glyphHidden: document.querySelector("#glyphCharacter")?.hidden,
    spriteHidden: document.querySelector("#worldSprite")?.hidden,
    spriteClass: document.querySelector("#worldSprite")?.className,
    glyphText: document.querySelector("#glyphCharacter b")?.textContent || ""
  }));
  if (!result.imageHidden || result.imageSrc) throw new Error(`${id} pending fallback exposed production img src ${result.imageSrc}`);
  if (result.characterId === "battery-buddy") throw new Error(`${id} resolved to Battery Buddy`);
  if (["leon", "zaya"].includes(id) && result.glyphHidden) throw new Error(`${id} glyph fallback is hidden`);
  if (id === "letter-a" && (!result.spriteClass.includes("sprite-letter") || result.spriteClass.includes("sprite-battery"))) throw new Error("Letter A fallback did not stay Letter A");
  if (id === "elephant" && (!result.spriteClass.includes("sprite-elephant") || result.spriteClass.includes("sprite-battery"))) throw new Error("Elephant fallback did not stay Elephant");
  if (id === "plane" && (!result.spriteClass.includes("sprite-plane") || result.spriteClass.includes("sprite-battery"))) throw new Error("Plane fallback did not stay Plane");
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await createServer();
  const port = server.address().port;
  const browser = await chromium.launch();
  const summary = { passed: true, viewports: [], forbiddenRequests: [] };
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.on("request", (request) => {
        const url = request.url();
        if (/source-safe-keeping|rejected-character-crops-v1|review-only|pilot-qa|contact-sheet|\/qa\//i.test(url)) summary.forbiddenRequests.push(url);
      });
      await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "networkidle" });
      for (const item of states) await assertBattery(page, item.value, item.state);
      await assertPendingFallback(page, "zaya", 50);
      await assertPendingFallback(page, "leon", 50);
      await assertPendingFallback(page, "elephant", 50);
      await assertPendingFallback(page, "plane", 50);
      await assertPendingFallback(page, "letter-a", 50);
      await assertBattery(page, 100, "excited");
      await assertPendingFallback(page, "zaya", 25);
      await assertBattery(page, 0, "empty");
      await page.locator("#energyCharacterImage").dispatchEvent("error");
      await page.waitForTimeout(80);
      const afterError = await page.evaluate(() => ({
        hidden: document.querySelector("#energyCharacterImage")?.hidden,
        spriteHidden: document.querySelector("#worldSprite")?.hidden,
        spriteClass: document.querySelector("#worldSprite")?.className
      }));
      if (!afterError.hidden || afterError.spriteHidden || !afterError.spriteClass.includes("sprite-battery")) {
        throw new Error("Image-load failure did not fall back to Battery procedural renderer");
      }
      const screenshot = path.join(outDir, `${viewport.name}-battery-and-fallback.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      summary.viewports.push({ ...viewport, screenshot: path.relative(root, screenshot) });
      await context.close();
    }
    if (summary.forbiddenRequests.length) throw new Error(`Forbidden runtime art request(s): ${summary.forbiddenRequests.join(", ")}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  fs.writeFileSync(path.join(outDir, "runtime-browser-v3.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log("Character runtime browser v3 check passed.");
}

await main();
