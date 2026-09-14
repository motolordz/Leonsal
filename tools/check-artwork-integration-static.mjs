import assert from "node:assert/strict";
import fs from "node:fs";

const js = fs.readFileSync("js/leonsal-artwork-integration.js", "utf8");

for (const forbidden of [
  "review-only",
  "source-safe-keeping",
  "pilot-qa",
  "contact-sheet",
  "rejected-character-crops-v1"
]) {
  assert(js.includes(forbidden), `Artwork integration must block ${forbidden}`);
}

assert(js.includes('record.status !== "approved"'), "Artwork integration must require approved records");
assert(js.includes("if (!window.LeonSalCharacters) return;"), "Artwork integration must guard the optional character helper");
assert(js.includes("var realWorld = setRealImage"), "Energy rendering must keep real-art resolution explicit");
assert(js.includes("var realDash = setRealImage"), "Dash rendering must keep real-art resolution explicit");
assert(js.includes("glyph.hidden = realWorld || realDash"), "Pending character fallback must not be hidden");
assert(js.includes("if (setRealImage(buddy, record"), "Pending number/letter buddies must not be blanked before approved art resolves");
assert(js.includes("if (setRealImage(tile, record"), "Pending letter tiles must not be blanked before approved art resolves");
assert(!js.includes('buddy.dataset.realApplied = "true";\n      setRealImage'), "Buddies must not mark real art before a successful approved-image resolve");
assert(!js.includes('tile.dataset.realApplied = "true";\n      tile.textContent = "";'), "Letter tiles must not clear text before a successful approved-image resolve");

console.log("Artwork integration static checks passed.");
