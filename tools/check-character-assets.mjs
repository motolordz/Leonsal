import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const registryPath = path.join(root, "data", "character-assets.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const requiredStates = ["empty", "low", "calm", "happy", "excited"];
const failures = [];
let count = 0;

for (const family of ["guides", "alphabet", "numbers", "world"]) {
  for (const record of registry[family] || []) {
    for (const state of requiredStates) {
      const asset = record.states && record.states[state];
      if (!asset) {
        failures.push(`${family}/${record.id}: missing ${state} state`);
        continue;
      }
      const fullPath = path.join(root, asset);
      if (!fs.existsSync(fullPath)) {
        failures.push(`${family}/${record.id}: missing file ${asset}`);
        continue;
      }
      if (!asset.endsWith(".webp")) {
        failures.push(`${family}/${record.id}: ${asset} is not a WebP production asset`);
      }
      if (fs.statSync(fullPath).size < 1024) {
        failures.push(`${family}/${record.id}: ${asset} is unexpectedly small`);
      }
      count += 1;
    }
  }
}

if (failures.length > 0) {
  console.error("Character asset check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Character asset check passed for ${count} state assets.`);
