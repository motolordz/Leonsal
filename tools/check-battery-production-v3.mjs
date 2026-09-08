import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const failures = [];
const results = [];

function hash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function signatureDistance(a, b) {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < length; i += 1) total += Math.abs(a[i] - b[i]);
  return total / Math.max(1, length);
}

async function inspectOne(assetPath, state, kind) {
  if (/source-safe-keeping|rejected-character-crops-v1|review-only|pilot-qa|contact-sheet|qa/i.test(assetPath)) {
    failures.push(`${state}/${kind}: blocked source path ${assetPath}`);
  }
  const full = path.join(root, assetPath);
  let source;
  try {
    source = await fs.readFile(full);
  } catch {
    failures.push(`${state}/${kind}: missing ${assetPath}`);
    return null;
  }
  let metadata;
  let raw;
  try {
    metadata = await sharp(source, { failOn: "error" }).metadata();
    raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  } catch (error) {
    failures.push(`${state}/${kind}: image does not decode (${error.message})`);
    return null;
  }
  const { width, height, channels } = raw.info;
  const data = raw.data;
  if (kind === "master" && metadata.format !== "png") failures.push(`${state}/${kind}: master must be PNG`);
  if (kind === "web" && metadata.format !== "webp") failures.push(`${state}/${kind}: derivative must be WebP`);
  if (kind === "master" && Math.max(width, height) < 2048) failures.push(`${state}/${kind}: longest dimension ${Math.max(width, height)}px is below 2048px`);
  if (!metadata.hasAlpha) failures.push(`${state}/${kind}: metadata has no alpha channel`);

  let transparent = 0;
  let nonTransparent = 0;
  let whiteGreyOpaque = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 8) transparent += 1;
      if (a > 245) {
        nonTransparent += 1;
        if (r > 220 && g > 220 && b > 220 && Math.max(r, g, b) - Math.min(r, g, b) < 18) whiteGreyOpaque += 1;
      }
      if (a > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const corners = [
    data[3],
    data[((width - 1) * channels) + 3],
    data[(((height - 1) * width) * channels) + 3],
    data[(((height * width) - 1) * channels) + 3]
  ];
  if (!transparent) failures.push(`${state}/${kind}: no transparent pixels`);
  if (corners.some((a) => a >= 8)) failures.push(`${state}/${kind}: all four corners must be transparent`);
  const pad = kind === "master" ? 120 : 24;
  if (minX < pad || minY < pad || width - maxX < pad || height - maxY < pad) {
    failures.push(`${state}/${kind}: subject bounding box lacks safe padding`);
  }
  if (nonTransparent && whiteGreyOpaque / nonTransparent > 0.82) {
    failures.push(`${state}/${kind}: appears to retain a mostly opaque white/grey source background`);
  }

  const signature = await sharp(source).ensureAlpha().resize({ width: 48, height: 48, fit: "contain" }).raw().toBuffer();
  return {
    state,
    kind,
    path: assetPath,
    width,
    height,
    hash: hash(source),
    bbox: { minX, minY, maxX, maxY },
    transparentPixels: transparent,
    signature
  };
}

for (const state of states) {
  const master = await inspectOne(`assets/characters-v2/battery/${state}/master.png`, state, "master");
  const web = await inspectOne(`assets/characters-v2/battery/${state}/web.webp`, state, "web");
  if (master) results.push(master);
  if (web) results.push(web);
}

const masterResults = results.filter((item) => item.kind === "master");
const masterHashes = new Set(masterResults.map((item) => item.hash));
if (masterHashes.size !== masterResults.length) failures.push("At least two master PNG files are byte-identical");
let distinctPairs = 0;
for (let a = 0; a < masterResults.length; a += 1) {
  for (let b = a + 1; b < masterResults.length; b += 1) {
    if (signatureDistance(masterResults[a].signature, masterResults[b].signature) > 3) distinctPairs += 1;
  }
}
if (distinctPairs < 8) failures.push("Battery states are not visually distinct enough");

const registry = JSON.parse(await fs.readFile(path.join(root, "data/character-assets.json"), "utf8"));
const battery = registry.world.find((record) => record.id === "battery-buddy");
if (!battery) failures.push("Battery Buddy registry record is missing");
if (battery?.status !== "approved") failures.push(`Battery Buddy status must be approved after final owner acceptance, got ${battery?.status}`);
for (const state of states) {
  const expected = `assets/characters-v2/battery/${state}/web.webp`;
  const expectedMaster = `assets/characters-v2/battery/${state}/master.png`;
  if (battery?.states?.[state] !== expected) failures.push(`Battery Buddy ${state} runtime path must be ${expected}`);
  if (battery?.masterStates?.[state] !== expectedMaster) failures.push(`Battery Buddy ${state} master path must be ${expectedMaster}`);
}
for (const section of ["guides", "alphabet", "numbers", "world"]) {
  for (const record of registry[section] || []) {
    if (record.id !== "battery-buddy" && record.status === "approved") {
      failures.push(`${section}/${record.id}: only Battery Buddy may be approved in this gate`);
    }
  }
}

await fs.mkdir(path.join(root, "qa/battery-production-v3"), { recursive: true });
await fs.writeFile(
  path.join(root, "qa/battery-production-v3/technical-verification.json"),
  JSON.stringify({
    checkedAt: new Date().toISOString(),
    failures,
    assets: results.map(({ signature, ...item }) => item)
  }, null, 2)
);

if (failures.length) {
  console.error("Battery production v3 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Battery production v3 check passed: 5 PNG masters and 5 WebP derivatives are transparent, padded, distinct, and approved for Battery Buddy only.");
