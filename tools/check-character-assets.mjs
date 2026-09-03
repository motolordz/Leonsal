import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const registryPath = path.join(root, "data", "character-assets.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const requiredStates = ["empty", "low", "calm", "happy", "excited"];
const families = ["guides", "alphabet", "numbers", "world"];
const failures = [];
const warnings = [];
let checked = 0;

function hash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function expectedPathFragment(family, recordId) {
  if (family === "guides") return `/characters-v2/${recordId}/`;
  if (family === "world") return `/characters-v2/world/${recordId}/`;
  if (family === "alphabet") return `/characters-v2/alphabet/${recordId.replace("letter-", "")}/`;
  if (family === "numbers") return `/characters-v2/numbers/${recordId.replace("number-", "")}/`;
  return "/characters-v2/";
}

async function inspectAsset(assetPath, label, family, recordId) {
  if (!assetPath) {
    failures.push(`${label}: missing asset path`);
    return null;
  }
  if (/source-safe-keeping|rejected-character-crops-v1|review-only|pilot-qa|contact-sheet|qa/.test(assetPath)) {
    failures.push(`${label}: production registry points at rejected/source path ${assetPath}`);
  }
  if (!assetPath.includes(expectedPathFragment(family, recordId))) {
    failures.push(`${label}: path does not match registry family/id: ${assetPath}`);
  }

  const fullPath = path.join(root, assetPath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${label}: missing file ${assetPath}`);
    return null;
  }

  let image;
  let raw;
  try {
    image = sharp(fullPath, { failOn: "error" });
    const metadata = await image.metadata();
    raw = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    image.metadataValue = metadata;
  } catch (error) {
    failures.push(`${label}: image does not decode (${error.message})`);
    return null;
  }

  const metadata = image.metadataValue;
  const { width, height, channels } = raw.info;
  const data = raw.data;
  if (Math.max(width, height) < 512) failures.push(`${label}: longest dimension ${Math.max(width, height)}px is below 512px`);
  if (!metadata.hasAlpha) failures.push(`${label}: file metadata has no alpha channel`);

  let transparent = 0;
  let opaqueWhiteGrey = 0;
  let nonTransparent = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 8) transparent += 1;
      if (a > 245) {
        nonTransparent += 1;
        if (r > 220 && g > 220 && b > 220 && Math.max(r, g, b) - Math.min(r, g, b) < 18) opaqueWhiteGrey += 1;
      }
      if (a > 24) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }

  const corners = [0, (width - 1) * channels, ((height - 1) * width) * channels, ((height * width) - 1) * channels].map((idx) => data[idx + 3]);
  if (!transparent) failures.push(`${label}: no transparent pixels found`);
  if (corners.some((a) => a >= 8)) failures.push(`${label}: all four canvas corners must be transparent`);
  if (minX <= 0 || minY <= 0 || maxX >= width - 1 || maxY >= height - 1) failures.push(`${label}: subject touches canvas edge`);
  if (nonTransparent && opaqueWhiteGrey / nonTransparent > 0.72) failures.push(`${label}: appears to be mostly opaque white/grey background`);

  const signatureBuffer = await sharp(fullPath)
    .ensureAlpha()
    .resize({ width: 32, height: 32, fit: "contain" })
    .raw()
    .toBuffer();

  return {
    width,
    height,
    hash: hash(fs.readFileSync(fullPath)),
    signature: signatureBuffer,
  };
}

function signatureDistance(a, b) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let total = 0;
  for (let index = 0; index < length; index += 1) total += Math.abs(a[index] - b[index]);
  return total / length;
}

for (const family of families) {
  for (const record of registry[family] || []) {
    if (record.status && record.status !== "approved") {
      warnings.push(`${family}/${record.id}: ${record.status}; skipped production alpha verification`);
      continue;
    }
    const keys = Object.keys(record.states || {}).sort();
    if (keys.join(",") !== requiredStates.slice().sort().join(",")) {
      failures.push(`${family}/${record.id}: approved record must expose exactly ${requiredStates.join(", ")}`);
      continue;
    }

    const inspected = [];
    for (const state of requiredStates) {
      const result = await inspectAsset(record.states[state], `${family}/${record.id}/${state}`, family, record.id);
      if (result) {
        inspected.push({ state, ...result });
        checked += 1;
      }
    }
    const hashes = new Set(inspected.map((item) => item.hash));
    if (hashes.size !== inspected.length) failures.push(`${family}/${record.id}: at least two state files are byte-identical`);
    let distinctPairs = 0;
    for (let a = 0; a < inspected.length; a += 1) {
      for (let b = a + 1; b < inspected.length; b += 1) {
        if (signatureDistance(inspected[a].signature, inspected[b].signature) > 1.2) distinctPairs += 1;
      }
    }
    if (distinctPairs < 4) failures.push(`${family}/${record.id}: state files appear perceptually too similar`);
  }
}

if (failures.length > 0) {
  console.error("Character asset check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error("Warnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log(`Character asset alpha check passed for ${checked} approved production assets.`);
if (warnings.length) {
  console.log("Skipped non-approved records:");
  for (const warning of warnings) console.log(`- ${warning}`);
}
