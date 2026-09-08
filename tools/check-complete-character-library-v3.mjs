import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, "data/character-assets.json"), "utf8"));
const families = ["guides", "alphabet", "numbers", "world", "planets"];
const states = ["empty", "low", "calm", "happy", "excited"];
const forbidden = /source-safe-keeping|rejected-character-crops-v1|review-only|pilot-qa|contact-sheet|qa/i;
const failures = [];
const approved = [];
const pathOwners = new Map();

const hash = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

async function inspect(assetPath, label, { master = false } = {}) {
  if (!assetPath) {
    failures.push(`${label}: missing path`);
    return null;
  }
  if (forbidden.test(assetPath)) failures.push(`${label}: forbidden runtime/source path ${assetPath}`);
  const full = path.join(root, assetPath);
  if (!fs.existsSync(full)) {
    failures.push(`${label}: file does not exist ${assetPath}`);
    return null;
  }
  const owner = pathOwners.get(assetPath);
  if (owner && owner !== label) failures.push(`${label}: path also used by ${owner}`);
  pathOwners.set(assetPath, label);
  const buffer = fs.readFileSync(full);
  let metadata;
  let raw;
  try {
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
    raw = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  } catch (error) {
    failures.push(`${label}: decode failed (${error.message})`);
    return null;
  }
  if (master && metadata.format !== "png") failures.push(`${label}: master must be PNG`);
  if (!master && metadata.format !== "webp") failures.push(`${label}: web derivative must be WebP`);
  if (master && Math.max(metadata.width || 0, metadata.height || 0) < 2048) failures.push(`${label}: master longest dimension below 2048`);
  if (!metadata.hasAlpha) failures.push(`${label}: missing alpha channel`);
  const { width, height, channels } = raw.info;
  const data = raw.data;
  const corners = [3, ((width - 1) * channels) + 3, (((height - 1) * width) * channels) + 3, (((height * width) - 1) * channels) + 3].map((idx) => data[idx]);
  if (corners.some((alpha) => alpha >= 8)) failures.push(`${label}: corner alpha is not transparent`);
  let minX = width, minY = height, maxX = -1, maxY = -1, transparent = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha < 8) transparent += 1;
      if (alpha > 24) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  if (!transparent) failures.push(`${label}: no transparent pixels`);
  const pad = master ? 70 : 10;
  if (minX < pad || minY < pad || width - maxX < pad || height - maxY < pad) failures.push(`${label}: insufficient transparent safe padding`);
  const signature = await sharp(buffer).ensureAlpha().resize({ width: 40, height: 40, fit: "contain" }).raw().toBuffer();
  return { width, height, hash: hash(buffer), signature };
}

function distance(a, b) {
  let total = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) total += Math.abs(a[i] - b[i]);
  return total / Math.max(1, length);
}

for (const family of families) {
  for (const record of registry[family] || []) {
    if (record.status !== "approved") continue;
    approved.push(record);
    const stateKeys = Object.keys(record.states || {}).sort().join(",");
    const masterKeys = Object.keys(record.masterStates || {}).sort().join(",");
    if (stateKeys !== states.slice().sort().join(",")) failures.push(`${family}/${record.id}: states must contain five canonical states`);
    if (masterKeys !== states.slice().sort().join(",")) failures.push(`${family}/${record.id}: masterStates must contain five canonical states`);
    const signatures = [];
    const hashes = [];
    for (const state of states) {
      const runtimePath = record.states?.[state] || "";
      const masterPath = record.masterStates?.[state] || "";
      if (record.id !== "battery-buddy" && /\/battery\//.test(runtimePath + masterPath)) failures.push(`${family}/${record.id}/${state}: non-Battery record references Battery path`);
      const masterResult = await inspect(masterPath, `${family}/${record.id}/${state}/master`, { master: true });
      await inspect(runtimePath, `${family}/${record.id}/${state}/web`);
      if (masterResult) {
        signatures.push(masterResult.signature);
        hashes.push(masterResult.hash);
      }
    }
    if (new Set(hashes).size !== hashes.length) failures.push(`${family}/${record.id}: duplicate master bytes across states`);
    let distinct = 0;
    for (let i = 0; i < signatures.length; i += 1) {
      for (let j = i + 1; j < signatures.length; j += 1) if (distance(signatures[i], signatures[j]) > 1.2) distinct += 1;
    }
    if (distinct < 4) failures.push(`${family}/${record.id}: states are not visually distinct enough`);
  }
}

const summary = {
  approvedCharacterCount: approved.length,
  approvedStateAssetCount: approved.length * states.length,
  families: Object.fromEntries(families.map((family) => [family, (registry[family] || []).filter((record) => record.status === "approved").length]))
};

fs.mkdirSync(path.join(root, "qa/character-production-v3/FINAL-REVIEW"), { recursive: true });
fs.writeFileSync(path.join(root, "qa/character-production-v3/FINAL-REVIEW/production-summary.json"), JSON.stringify({ ...summary, failures }, null, 2) + "\n");

if (failures.length) {
  console.error("Complete character library v3 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Complete character library v3 check passed: ${summary.approvedCharacterCount} characters, ${summary.approvedStateAssetCount} approved state assets.`);
console.log(`Family counts: ${JSON.stringify(summary.families)}`);
