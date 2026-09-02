import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const failures = [];

const alphabet = readJson("data/alphabet.json");
const numbers = readJson("data/numbers.json");
const planets = readJson("data/planets.json");
const world = readJson("data/world-characters.json");
const characterAssets = readJson("data/character-assets.json");
const canonicalStates = ["empty", "low", "calm", "happy", "excited"];

const expectedLetters = "abcdefghijklmnopqrstuvwxyz".split("");
if (alphabet.length !== 26) {
  failures.push(`alphabet: expected 26 records, found ${alphabet.length}`);
}

expectedLetters.forEach((letter, index) => {
  const record = alphabet[index];
  if (!record || record.id !== `letter-${letter}` || record.uppercase !== letter.toUpperCase()) {
    failures.push(`alphabet: position ${index + 1} must be ${letter.toUpperCase()}`);
  }
});

if (numbers.length !== 10) {
  failures.push(`numbers: expected 10 records, found ${numbers.length}`);
}

numbers.forEach((record, index) => {
  const expected = index + 1;
  if (record.value !== expected || record.id !== `number-${expected}`) {
    failures.push(`numbers: position ${index + 1} must be number-${expected}`);
  }
  if (!Array.isArray(record.quantity) || record.quantity.length !== expected) {
    failures.push(`numbers: number-${expected} must expose exactly ${expected} quantity markers`);
  }
});

const expectedPlanets = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Moon"];
for (const name of expectedPlanets) {
  const record = planets.find((item) => item.astronomy && item.astronomy.name === name);
  if (!record) {
    failures.push(`planets: missing astronomical record for ${name}`);
  } else if (!record.personality || !record.personality.learningRole) {
    failures.push(`planets: ${name} must keep personality fields separate`);
  }
}

if (world.length !== 20) {
  failures.push(`world characters: expected 20 records, found ${world.length}`);
}

for (const record of world) {
  if (!record.id || !record.displayName || !Array.isArray(record.states) || record.states.length < 5) {
    failures.push(`world characters: ${record.id || "unknown"} missing required state metadata`);
  }
}

for (const family of ["guides", "alphabet", "numbers", "world"]) {
  for (const record of characterAssets[family] || []) {
    const keys = Object.keys(record.states || {}).sort();
    if (keys.join(",") !== canonicalStates.slice().sort().join(",")) {
      failures.push(`${family}: ${record.id} must expose exactly ${canonicalStates.join(", ")}`);
      continue;
    }

    for (const state of canonicalStates) {
      const assetPath = record.states[state];
      if (!assetPath || !fs.existsSync(path.join(root, assetPath))) {
        failures.push(`${family}: ${record.id}.${state} missing asset ${assetPath}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Registry check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Registry check passed for alphabet, numbers, planets, and world characters.");
