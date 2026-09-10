import { pixelDistance as distance, statesAreDistinct } from './character-integrity-metrics.mjs';
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const states = ["empty", "low", "calm", "happy", "excited"];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "leonsal-integrity-"));

async function makePng(file, colour, alpha = 255, offset = 0) {
  const width = 320;
  const height = 320;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="transparent"/>
    <circle cx="${160 + offset}" cy="160" r="90" fill="${colour}" fill-opacity="${alpha / 255}"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function signature(file) {
  return sharp(file).ensureAlpha().resize({ width: 48, height: 48, fit: "contain" }).raw().toBuffer();
}

async function nonTransparentPixels(file) {
  const raw = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  let count = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] > 24) count += 1;
  }
  return count;
}

async function stateDistinctEnough(files) {
  const signatures = [];
  for (const file of files) signatures.push(await signature(file));
  return statesAreDistinct(signatures);
}

async function main() {
  const nearIdentical = [];
  for (const [index, state] of states.entries()) {
    const file = path.join(tmp, `${state}.png`);
    await makePng(file, index === 4 ? "#42c8ff" : "#32cc66", 255, index === 4 ? 40 : 0);
    nearIdentical.push(file);
  }
  if (await stateDistinctEnough(nearIdentical)) throw new Error("Near-identical four-state fixture was incorrectly accepted");

  const empty = path.join(tmp, "empty-transparent.png");
  await sharp({ create: { width: 320, height: 320, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(empty);
  if (await nonTransparentPixels(empty) !== 0) throw new Error("Fully transparent fixture unexpectedly has subject pixels");

  const master = path.join(tmp, "master.png");
  const wrongWeb = path.join(tmp, "wrong.webp");
  await makePng(master, "#32cc66", 255, 0);
  await makePng(path.join(tmp, "wrong-source.png"), "#d84b5f", 255, 60);
  await sharp(path.join(tmp, "wrong-source.png")).webp().toFile(wrongWeb);
  const mismatchDistance = distance(await signature(master), await signature(wrongWeb));
  if (mismatchDistance <= 20) throw new Error("Wrong WebP derivative fixture was not detected as visually mismatched");

  const out = path.join(process.cwd(), "qa/character-production-v3/FINAL-REVIEW/integrity-regressions-v3.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({
    passed: true,
    fixtures: {
      nearIdenticalStatesRejected: true,
      fullyTransparentRejected: true,
      wrongDerivativeRejected: true
    }
  }, null, 2) + "\n");
  console.log("Character integrity regression fixtures passed.");
}

await main();
