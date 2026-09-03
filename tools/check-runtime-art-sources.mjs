import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, "data", "character-assets.json"), "utf8"));
const families = ["guides", "alphabet", "numbers", "world", "pilot"];
const states = ["empty", "low", "calm", "happy", "excited"];
const forbidden = /source-safe-keeping|rejected-character-crops-v1|review-only|pilot-qa|contact-sheet|qa/i;
const failures = [];

for (const family of families) {
  for (const record of registry[family] || []) {
    const recordStates = record.states || {};
    if (record.status !== "approved" && Object.keys(recordStates).length > 0) {
      failures.push(`${family}/${record.id}: ${record.status || "unapproved"} record exposes runtime states`);
    }
    if (record.status === "approved") {
      for (const state of states) {
        const assetPath = recordStates[state];
        if (!assetPath) failures.push(`${family}/${record.id}: approved record missing ${state}`);
        if (assetPath && forbidden.test(assetPath)) failures.push(`${family}/${record.id}/${state}: forbidden runtime path ${assetPath}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Runtime art source check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Runtime art source check passed: only approved records may expose runtime image paths.");
