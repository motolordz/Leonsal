import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, "data/character-assets.json"), "utf8"));
const pilot = JSON.parse(fs.readFileSync(path.join(root, "qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/pilot-report.json"), "utf8"));
const completeness = JSON.parse(fs.readFileSync(path.join(root, "qa/character-production-v3/FINAL-REVIEW/full-library-completeness.json"), "utf8"));
const failures = [];

const records = ["guides", "alphabet", "numbers", "world", "planets"]
  .flatMap((family) => (registry[family] || []).map((record) => ({ ...record, registryGroup: family })));
const approved = records.filter((record) => record.status === "approved");
const pendingGuides = records.filter((record) => record.family === "guide" && record.status !== "approved");

assert.equal(pilot.status, "review-only", "Leon/Zaya guide pilot must remain review-only");
assert.equal(pilot.productionApproved, false, "Leon/Zaya guide pilot must not be production approved");
assert.match(pilot.decision || "", /Do not register as approved/i, "Leon/Zaya guide pilot decision must block runtime promotion");
assert.equal(approved.length, 1, "Battery Buddy must remain the only approved character until a new exact asset version passes gates");
assert.equal(approved[0]?.id, "battery-buddy", "The only approved character must be Battery Buddy");
assert.equal(pendingGuides.length, 2, "Leon and Zaya must remain pending until transparent 2048px masters exist");
assert.equal(completeness.complete, false, "Full-library completeness report must remain incomplete while guide art is pending");

for (const record of records.filter((item) => item.status !== "approved")) {
  if (Object.keys(record.states || {}).length) {
    failures.push(`${record.registryGroup}/${record.id}: pending/rejected record exposes runtime states`);
  }
}

for (const output of pilot.outputs || []) {
  const fullPath = path.join(root, output.path);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Guide pilot output missing: ${output.path}`);
    continue;
  }
  const metadata = await sharp(fullPath).metadata();
  if (metadata.hasAlpha) failures.push(`Guide pilot output unexpectedly has alpha and needs re-audit: ${output.path}`);
  if (output.path.includes("individual") && Math.max(metadata.width || 0, metadata.height || 0) >= 2048) {
    failures.push(`Individual guide pilot output reached master size but remains failed; re-audit: ${output.path}`);
  }
  if (!String(output.archivedSourcePath || "").startsWith("assets/source-safe-keeping/generated-attempts/")) {
    failures.push(`Guide pilot output missing source-safe-keeping archive path: ${output.path}`);
  }
}

if (failures.length) {
  console.error("Character art method status check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Character art method status check passed: guide pilot is review-only, Battery remains the only approved runtime character, and pending art exposes no runtime states.");
