import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const registry = JSON.parse(fs.readFileSync(path.join(root, "data/character-assets.json"), "utf8"));
const guides = JSON.parse(fs.readFileSync(path.join(root, "data/characters.json"), "utf8"));
const alphabet = JSON.parse(fs.readFileSync(path.join(root, "data/alphabet.json"), "utf8"));
const numbers = JSON.parse(fs.readFileSync(path.join(root, "data/numbers.json"), "utf8"));
const world = JSON.parse(fs.readFileSync(path.join(root, "data/world-characters.json"), "utf8"));
const planets = JSON.parse(fs.readFileSync(path.join(root, "data/planets.json"), "utf8"));

function recordsById() {
  const map = new Map();
  for (const family of ["guides", "alphabet", "numbers", "world", "planets"]) {
    for (const record of registry[family] || []) map.set(record.id, record);
  }
  return map;
}

function requiredIds() {
  const guideIds = (guides.guides || []).map((guide) => guide.id.replace(/^guide-/, ""));
  const alphabetIds = alphabet.map((letter) => letter.id);
  const numberIds = numbers.map((number) => number.id);
  const worldIds = ["battery-buddy", ...world.map((character) => character.id)];
  const planetIds = planets.map((planet) => planet.characterId);
  return {
    guides: guideIds,
    alphabet: alphabetIds,
    numbers: numberIds,
    world: [...new Set(worldIds)],
    planets: [...new Set(planetIds)]
  };
}

const records = recordsById();
const required = requiredIds();
const missing = [];
const pending = [];
const incomplete = [];
const approved = [];

for (const [family, ids] of Object.entries(required)) {
  for (const id of ids) {
    const record = records.get(id);
    if (!record) {
      missing.push({ family, id, reason: "missing-registry-record" });
      continue;
    }
    if (record.status !== "approved") {
      pending.push({ family, id, status: record.status, reason: "not-production-approved" });
      continue;
    }
    const stateKeys = states.filter((state) => record.states?.[state] && record.masterStates?.[state]);
    if (stateKeys.length !== states.length) {
      incomplete.push({ family, id, approvedStates: stateKeys, reason: "missing-five-approved-states" });
      continue;
    }
    approved.push({ family, id });
  }
}

const summary = {
  complete: missing.length === 0 && pending.length === 0 && incomplete.length === 0,
  requiredCharacterCount: Object.values(required).reduce((total, ids) => total + ids.length, 0),
  approvedCharacterCount: approved.length,
  approvedStateAssetCount: approved.length * states.length,
  pendingCharacterCount: pending.length,
  pendingStateAssetCount: pending.length * states.length,
  missingCharacterCount: missing.length,
  incompleteCharacterCount: incomplete.length,
  approved,
  pending,
  missing,
  incomplete
};

const outDir = path.join(root, "qa/character-production-v3/FINAL-REVIEW");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "full-library-completeness.json"), JSON.stringify(summary, null, 2) + "\n");

if (!summary.complete) {
  console.error(`Full character library completeness failed as expected: ${summary.approvedCharacterCount}/${summary.requiredCharacterCount} characters production-approved.`);
  console.error(`Pending: ${summary.pendingCharacterCount}; missing: ${summary.missingCharacterCount}; incomplete: ${summary.incompleteCharacterCount}`);
  process.exit(1);
}

console.log(`Full character library completeness passed: ${summary.approvedCharacterCount}/${summary.requiredCharacterCount} characters approved.`);
