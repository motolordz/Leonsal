import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = "qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-intake.json";
const sheetPath = "qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-contact-sheet.png";
const fiveStateSheetPath = "qa/character-production-v3/READINESS/supplied-character-five-state-review.png";
const registryPath = "data/character-assets.json";
const reviewPath = "data/character-review.json";

const manifest = JSON.parse(await fs.readFile(path.join(root, manifestPath), "utf8"));
const registry = JSON.parse(await fs.readFile(path.join(root, registryPath), "utf8"));
const review = JSON.parse(await fs.readFile(path.join(root, reviewPath), "utf8"));
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
await sharp(path.join(root, fiveStateSheetPath)).metadata();

assert.equal(review.status, "review-only", "Character review registry must remain review-only");
assert.equal(review.productionApproved, false, "Character review registry must not approve production art");
assert.equal(review.lastSuppliedIntake, manifestPath, "Character review registry must point at the latest supplied intake manifest");

const reviewById = new Map((review.characters || []).map(character => [character.id, character]));
for (const [characterId, expectedStates] of [
  ["elephant", ["calm", "empty", "excited", "happy", "low"]],
  ["zaya", ["calm", "empty", "excited", "happy", "low"]],
  ["leon", ["calm", "excited", "happy", "low"]]
]) {
  const character = reviewById.get(characterId);
  assert(character, `${characterId} must exist in character review registry`);
  assert.equal(character.status, "review-only", `${characterId} review registry record must remain review-only`);
  assert.deepEqual(Object.keys(character.states || {}).sort(), expectedStates, `${characterId} review states must match the corrected 20260915 intake`);
  for (const state of expectedStates) {
    const asset = character.states[state];
    assert(asset.src.startsWith("assets/character-review/supplied-20260915/"), `${characterId}/${state} review src must use the 20260915 review derivative`);
    assert(asset.source.startsWith("assets/source-safe-keeping/supplied-20260915/"), `${characterId}/${state} source must use the 20260915 source-safe file`);
    assert.equal(asset.intake, manifestPath, `${characterId}/${state} must record the 20260915 intake manifest`);
  }
}

console.log("Supplied character intake 20260915 check passed: 15 review-only references, 1 sensitive file excluded, Battery remains the only approved character.");
