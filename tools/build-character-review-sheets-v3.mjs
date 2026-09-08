import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const registry = JSON.parse(await fs.readFile(path.join(root, "data/character-assets.json"), "utf8"));
const outRoot = path.join(root, "qa/character-production-v3/FAMILY-REVIEW");
const finalRoot = path.join(root, "qa/character-production-v3/FINAL-REVIEW");

await fs.mkdir(outRoot, { recursive: true });
await fs.mkdir(finalRoot, { recursive: true });

async function makeSheet(records, fileName, options = {}) {
  const cell = options.cell || 172;
  const labelH = 52;
  const nameW = options.nameW || 230;
  const width = nameW + states.length * cell;
  const height = labelH + records.length * cell;
  const base = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="c" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#fff"/><rect width="14" height="14" fill="#dbe8f5"/><rect x="14" y="14" width="14" height="14" fill="#dbe8f5"/></pattern></defs>
    <rect width="100%" height="100%" fill="#f8fbff"/>
    <rect x="${nameW}" y="${labelH}" width="${states.length * cell}" height="${records.length * cell}" fill="url(#c)"/>
    ${states.map((state, i) => `<text x="${nameW + i * cell + cell / 2}" y="34" text-anchor="middle" font-family="Arial" font-size="20" font-weight="900" fill="#102746">${state.toUpperCase()}</text>`).join("")}
    ${records.map((record, i) => `<text x="${nameW - 16}" y="${labelH + i * cell + cell / 2 + 8}" text-anchor="end" font-family="Arial" font-size="18" font-weight="800" fill="#244968">${record.displayName}</text>`).join("")}
  </svg>`);
  const composites = [];
  for (const [row, record] of records.entries()) {
    for (const [col, state] of states.entries()) {
      const img = await sharp(path.join(root, record.masterStates[state])).resize({ width: cell - 28, height: cell - 28, fit: "contain" }).png().toBuffer();
      composites.push({ input: img, left: nameW + col * cell + 14, top: labelH + row * cell + 14 });
    }
  }
  const output = path.join(outRoot, fileName);
  await sharp(base).composite(composites).png().toFile(output);
  return output;
}

async function makeCharacterSheet(record) {
  const cell = 360;
  const labelH = 88;
  const width = states.length * cell;
  const height = labelH + 394;
  const base = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fff"/><rect width="20" height="20" fill="#d9e5f2"/><rect x="20" y="20" width="20" height="20" fill="#d9e5f2"/></pattern></defs>
    <rect width="${width}" height="${labelH}" fill="#f8fbff"/>
    <rect y="${labelH}" width="${width}" height="394" fill="url(#c)"/>
    ${states.map((state, i) => `<text x="${i * cell + cell / 2}" y="34" text-anchor="middle" font-family="Arial" font-size="25" font-weight="900" fill="#102746">${state.toUpperCase()}</text>`).join("")}
    <text x="${width / 2}" y="68" text-anchor="middle" font-family="Arial" font-size="20" font-weight="800" fill="#496079">${record.displayName}</text>
  </svg>`);
  const composites = [];
  for (const [index, state] of states.entries()) {
    const img = await sharp(path.join(root, record.masterStates[state])).resize({ width: 300, height: 300, fit: "contain" }).png().toBuffer();
    composites.push({ input: img, left: index * cell + 30, top: labelH + 44 });
  }
  const safeId = record.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const outDir = path.join(root, "qa/character-production-v3", safeId);
  await fs.mkdir(outDir, { recursive: true });
  const output = path.join(outDir, "five-states.png");
  await sharp(base).composite(composites).png().toFile(output);
  return path.relative(root, output);
}

const guideRecords = registry.guides || [];
const alphabetRecords = registry.alphabet || [];
const numberRecords = registry.numbers || [];
const worldRecords = registry.world || [];
const planetRecords = registry.planets || [];

await makeSheet(guideRecords, "leon-zaya-five-states.png", { cell: 220, nameW: 170 });
await makeSheet(alphabetRecords, "alphabet-five-states.png", { cell: 128, nameW: 150 });
await makeSheet(numberRecords, "numbers-five-states.png", { cell: 160, nameW: 150 });
await makeSheet(worldRecords, "world-characters-five-states.png", { cell: 148, nameW: 220 });
await makeSheet(planetRecords, "planets-five-states.png", { cell: 160, nameW: 180 });

const all = [...guideRecords, ...alphabetRecords, ...numberRecords, ...worldRecords, ...planetRecords];
const characterSheets = [];
for (const record of all) {
  characterSheets.push(await makeCharacterSheet(record));
}
const finalSheet = await makeSheet(all, "../FINAL-REVIEW/leonsal-complete-character-library.png", { cell: 104, nameW: 210 });
const summary = {
  generatedAt: new Date().toISOString(),
  totalCharacters: all.length,
  totalStateAssets: all.length * states.length,
  sheets: [
    "qa/character-production-v3/FAMILY-REVIEW/leon-zaya-five-states.png",
    "qa/character-production-v3/FAMILY-REVIEW/alphabet-five-states.png",
    "qa/character-production-v3/FAMILY-REVIEW/numbers-five-states.png",
    "qa/character-production-v3/FAMILY-REVIEW/world-characters-five-states.png",
    "qa/character-production-v3/FAMILY-REVIEW/planets-five-states.png",
    "qa/character-production-v3/FINAL-REVIEW/leonsal-complete-character-library.png"
  ],
  finalSheet: path.relative(root, finalSheet)
  , characterSheets
};
await fs.writeFile(path.join(finalRoot, "review-sheet-summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(`Generated ${summary.sheets.length} review sheets for ${summary.totalCharacters} characters.`);
