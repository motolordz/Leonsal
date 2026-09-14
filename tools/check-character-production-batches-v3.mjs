import assert from "node:assert/strict";
import fs from "node:fs/promises";

const registry = JSON.parse(await fs.readFile("data/character-assets.json", "utf8"));
const readiness = JSON.parse(await fs.readFile("qa/character-production-v3/READINESS/character-readiness-report.json", "utf8"));
const batchReport = JSON.parse(await fs.readFile("qa/character-production-v3/READINESS/character-production-batches.json", "utf8"));

const records = ["guides", "alphabet", "numbers", "world", "planets"]
  .flatMap((group) => registry[group] || []);
const approved = records.filter((record) => record.status === "approved");
const pending = records.filter((record) => record.status !== "approved");
const batches = batchReport.batches || [];

assert.equal(batchReport.schemaVersion, 1, "Unexpected production batch schema version");
assert.equal(batches.length, 6, "Expected six character production batches");
assert.equal(approved.length, 1, "Only Battery Buddy may be approved at this stage");
assert.equal(approved[0].id, "battery-buddy", "Battery Buddy must be the only approved character");
assert.equal(pending.length, 68, "Expected 68 pending production characters");
assert.equal(readiness.summary.approvedRuntimeStateAssets, 5, "Only Battery Buddy's five states may be runtime approved");
assert.equal(readiness.summary.pendingGeneratedVectorSources, 340, "Expected 340 generated SVG-backed pending state sources");
assert(/Only records with status approved/i.test(batchReport.runtimeRule), "Runtime rule must require approved status");
for (const blocked of ["source-safe-keeping", "review-only", "QA", "contact-sheet", "rejected"]) {
  assert(batchReport.runtimeRule.includes(blocked), `Runtime rule must explicitly block ${blocked}`);
}

const byId = new Map(batches.map((batch) => [batch.id, batch]));
for (const id of [
  "batch-1-guides-leon-zaya",
  "batch-2-supplied-world-poses",
  "batch-3-alphabet",
  "batch-4-numbers",
  "batch-5-world",
  "batch-6-planets"
]) {
  assert(byId.has(id), `Missing production batch: ${id}`);
  assert.notEqual(byId.get(id).characterCount, 0, `${id} must not be empty`);
  assert.equal(byId.get(id).status, "pending-production", `${id} must not claim completion`);
}

assert.deepEqual(byId.get("batch-1-guides-leon-zaya").characters.map((record) => record.id).sort(), ["leon", "zaya"], "Guide batch must contain only Leon and Zaya");
assert.equal(byId.get("batch-3-alphabet").characterCount, 26, "Alphabet batch must contain A-Z");
assert.equal(byId.get("batch-4-numbers").characterCount, 10, "Number batch must contain 1-10");
assert.equal(byId.get("batch-5-world").characterCount, 20, "World batch must contain the canonical 20 non-Battery world characters");
assert.equal(byId.get("batch-6-planets").characterCount, 10, "Planet batch must contain the canonical planet set");
assert(byId.get("batch-2-supplied-world-poses").characters.some((record) => record.id === "supplied-elephant"), "Supplied Elephant review intake must stay visible");

const allBatchCharacters = batches.flatMap((batch) => batch.characters || []);
assert(allBatchCharacters.every((record) => record.status !== "approved"), "No pending production batch character may be marked approved");
assert(allBatchCharacters.some((record) => record.id === "leon" && record.blockers.some((blocker) => /empty/i.test(blocker))), "Leon empty blocker must remain explicit");
assert(allBatchCharacters.every((record) => (record.blockers || []).length > 0), "Every pending batch record should state its current blocker");

console.log("Character production batch checks passed.");
