import assert from "node:assert/strict";
import fs from "node:fs";

const lanePath = "qa/character-production-v3/GUIDE-PRODUCTION-LANE/guide-production-lane.json";
const sheetPath = "qa/character-production-v3/GUIDE-PRODUCTION-LANE/guide-production-lane.png";
const lane = JSON.parse(fs.readFileSync(lanePath, "utf8"));

assert.equal(lane.status, "pending-production", "Guide production lane must not claim completion");
assert.equal(lane.guides.length, 2, "Guide production lane must cover Leon and Zaya");
for (const id of ["leon", "zaya"]) {
  const guide = lane.guides.find((record) => record.id === id);
  assert(guide, `Missing guide lane record: ${id}`);
  assert.equal(guide.approvalDecision, "blocked", `${id} must remain blocked until production masters pass`);
  assert.equal(guide.productionStatus, "pending-art", `${id} registry status must remain pending-art`);
  assert(guide.blockers.includes("not-production-approved"), `${id} must keep not-production-approved blocker`);
  assert(guide.blockers.some((item) => /2048px production master/.test(item)), `${id} must keep production-size blocker`);
  assert(!Object.values(guide.suppliedSourceResolution || {}).some((state) => /qa\/|contact-sheet|rejected/i.test(state.source)), `${id} must not point supplied source states at QA/contact/rejected art`);
}
assert(lane.guides.find((record) => record.id === "leon").missingSuppliedStates.includes("empty"), "Leon empty state must remain explicitly missing");
assert.equal(lane.guides.find((record) => record.id === "zaya").missingSuppliedStates.length, 0, "Zaya supplied review states should be complete");
assert(fs.existsSync(sheetPath), "Guide production lane contact sheet missing");

console.log("Guide production lane check passed.");
