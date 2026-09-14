import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const review = JSON.parse(await fs.readFile("data/character-review.json", "utf8"));
const registry = JSON.parse(await fs.readFile("data/character-assets.json", "utf8"));
const states = ["empty", "low", "calm", "happy", "excited"];
const failures = [];

const reviewCharacters = review.characters || [];
const leonReview = reviewCharacters.find((character) => character.id === "leon");
assert(leonReview, "Leon review intake must exist");
assert.equal(leonReview.status, "review-only", "Leon intake must remain review-only");

const suppliedLeonStates = states.filter((state) => Boolean(leonReview.states?.[state]));
if (suppliedLeonStates.includes("empty")) failures.push("Leon review intake must not hide the missing supplied EMPTY state");

const leonRegistry = (registry.guides || []).find((character) => character.id === "leon");
assert(leonRegistry, "Leon production registry record must exist");
if (leonRegistry.status === "approved") failures.push("Leon must not be approved while supplied EMPTY production art is unresolved");
if (Object.keys(leonRegistry.states || {}).length) failures.push("Pending Leon registry record must not expose runtime states");

const approvedRecords = ["guides", "alphabet", "numbers", "world", "planets"]
  .flatMap((family) => registry[family] || [])
  .filter((record) => record.status === "approved");
if (approvedRecords.some((record) => record.id !== "battery-buddy")) {
  failures.push("Battery Buddy must remain the only approved production character until new assets pass the full gate");
}

const failedReportPath = "qa/character-production-v3/leon/failed-generated-empty/report.json";
const failedReport = JSON.parse(await fs.readFile(failedReportPath, "utf8"));
assert.equal(failedReport.character, "leon", "Failed Leon report must target Leon");
assert.equal(failedReport.state, "empty", "Failed Leon report must target empty state");
assert.equal(failedReport.status, "failed-closed", "Failed generated attempts must be closed as failed");
assert.equal(failedReport.productionApproved, false, "Failed generated attempts must not be production approved");

for (const attempt of failedReport.attempts || []) {
  if (!/source-safe-keeping\/generated-attempts\/leon\/empty\//.test(attempt.path)) {
    failures.push(`Rejected attempt is not stored in generated-attempts source-safe-keeping: ${attempt.path}`);
  }
  const metadata = await sharp(path.join(root, attempt.path)).metadata();
  if (metadata.hasAlpha) failures.push(`Rejected attempt unexpectedly reports alpha; re-audit manually: ${attempt.path}`);
  if (attempt.productionVerdict !== "rejected") failures.push(`Attempt missing rejected verdict: ${attempt.path}`);
}

if (failures.length) {
  console.error("Character production intake check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Character production intake check passed: Leon has ${suppliedLeonStates.length}/5 supplied review states; generated empty attempts remain rejected.`);
