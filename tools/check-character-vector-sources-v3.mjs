import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const registry = JSON.parse(await fs.readFile("data/character-assets.json", "utf8"));
const states = ["empty", "low", "calm", "happy", "excited"];
const families = ["guides", "alphabet", "numbers", "world", "planets"];
const failures = [];
let checked = 0;

function sourcePathFor(masterPath) {
  return masterPath.replace(/\/master\.png$/, "/source.svg");
}

for (const family of families) {
  for (const record of registry[family] || []) {
    if (record.id === "battery-buddy") continue;
    if (!record.masterStates || !/procedural review artwork|Generated V3 review asset set/i.test(record.notes || "")) continue;
    for (const state of states) {
      const masterPath = record.masterStates[state];
      if (!masterPath) {
        failures.push(`${family}/${record.id}/${state}: missing master state path`);
        continue;
      }
      const svgPath = sourcePathFor(masterPath);
      let svg;
      try {
        svg = await fs.readFile(path.join(root, svgPath), "utf8");
      } catch {
        failures.push(`${family}/${record.id}/${state}: missing vector source ${svgPath}`);
        continue;
      }
      if (!/<svg\b/i.test(svg)) failures.push(`${family}/${record.id}/${state}: vector source is not SVG`);
      if (/<(?:image|script|foreignObject)\b|data:image|(?:href|xlink:href)\s*=/i.test(svg)) {
        failures.push(`${family}/${record.id}/${state}: vector source embeds raster/external/script content`);
      }
      checked += 1;
    }
  }
}

assert(checked >= 300, "Expected broad non-Battery generated vector source coverage");

if (failures.length) {
  console.error("Character vector source check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Character vector source check passed for ${checked} generated state sources.`);
