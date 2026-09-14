import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = "qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-intake.json";
const sheetPath = "qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-contact-sheet.png";
const registryPath = "data/character-assets.json";

const manifest = JSON.parse(await fs.readFile(path.join(root, manifestPath), "utf8"));
const registry = JSON.parse(await fs.readFile(path.join(root, registryPath), "utf8"));
const entries = manifest.entries || [];

assert.equal(manifest.status, "review-only", "Supplied intake must remain review-only");
assert.equal(manifest.productionApproved, false, "Supplied intake must not approve production art");
assert.equal(entries.length, 15, "Expected 15 character artwork references in the 20260915 intake");
assert((manifest.excluded || []).some(item => /IMG_7371\.jpg$/.test(item.path) && item.reason === "excluded-sensitive-non-character-screenshot"), "Sensitive non-character screenshot must be recorded as excluded");

const statesByCharacter = new Map();
for (const entry of entries) {
  if (!statesByCharacter.has(entry.character)) statesByCharacter.set(entry.character, new Set());
  statesByCharacter.get(entry.character).add(entry.state);
}
assert.deepEqual([...statesByCharacter.get("elephant") || []].sort(), ["calm", "empty", "excited", "happy", "low"], "Elephant intake must include the five supplied energy states");
assert.deepEqual([...statesByCharacter.get("zaya") || []].sort(), ["calm", "empty", "excited", "happy", "low"], "Zaya intake must include the five supplied energy states");
assert.deepEqual([...statesByCharacter.get("leon") || []].sort(), ["calm", "excited", "happy", "low"], "Leon intake must keep EMPTY unresolved and must not invent a neutral energy state");
assert.deepEqual([...statesByCharacter.get("lion") || []], ["reference-sheet"], "Lion intake must remain a reference sheet only");

for (const entry of entries) {
  assert.equal(entry.status, "review-only", `${entry.character}/${entry.state} must remain review-only`);
  assert.equal(entry.productionApproved, false, `${entry.character}/${entry.state} must not be production approved`);
  assert(entry.sourcePath.startsWith("assets/source-safe-keeping/supplied-20260915/"), `${entry.character}/${entry.state} source must stay in source-safe-keeping`);
  assert(!/IMG_7371/i.test(entry.sourcePath), "Sensitive screenshot must not be copied into source-safe-keeping");
  const filePath = path.join(root, entry.sourcePath);
  const metadata = await sharp(filePath).metadata();
  assert.equal(metadata.width, entry.width, `${entry.sourcePath} width changed from manifest`);
  assert.equal(metadata.height, entry.height, `${entry.sourcePath} height changed from manifest`);
  assert.equal(Boolean(metadata.hasAlpha), Boolean(entry.hasAlpha), `${entry.sourcePath} alpha metadata changed from manifest`);
}

const approvedRecords = ["guides", "alphabet", "numbers", "world", "planets"]
  .flatMap(group => registry[group] || [])
  .filter(record => record.status === "approved");
assert.deepEqual(approvedRecords.map(record => record.id), ["battery-buddy"], "Supplied intake must not alter production approval truth");

await sharp(path.join(root, sheetPath)).metadata();

console.log("Supplied character intake 20260915 check passed: 15 review-only references, 1 sensitive file excluded, Battery remains the only approved character.");
