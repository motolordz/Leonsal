import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = "qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-intake.json";
const reviewPath = "data/character-review.json";
const reviewAssetRoot = "assets/character-review/supplied-20260915";
const energyStates = new Set(["empty", "low", "calm", "happy", "excited"]);

const manifest = JSON.parse(await fs.readFile(path.join(root, manifestPath), "utf8"));
const review = JSON.parse(await fs.readFile(path.join(root, reviewPath), "utf8"));
const characters = review.characters || [];
const byId = new Map(characters.map(character => [character.id, character]));

async function transparentStats(sourcePath) {
  const { data, info } = await sharp(path.join(root, sourcePath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const corners = [
    data[3],
    data[((info.width - 1) * info.channels) + 3],
    data[(((info.height - 1) * info.width) * info.channels) + 3],
    data[(((info.height * info.width) - 1) * info.channels) + 3]
  ];
  let transparentPixels = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] === 0) transparentPixels += 1;
  }
  return { corners, transparentPixels };
}

for (const entry of manifest.entries || []) {
  if (!energyStates.has(entry.state)) continue;
  const character = byId.get(entry.character);
  if (!character) continue;
  await fs.mkdir(path.join(root, reviewAssetRoot, entry.character), { recursive: true });
  const webPath = path.join(reviewAssetRoot, entry.character, `${entry.state}.webp`);
  await sharp(path.join(root, entry.sourcePath))
    .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 92 })
    .toFile(path.join(root, webPath));
  const { corners, transparentPixels } = await transparentStats(entry.sourcePath);
  character.states ||= {};
  character.states[entry.state] = {
    src: webPath,
    source: entry.sourcePath,
    width: entry.width,
    height: entry.height,
    hasAlpha: entry.hasAlpha,
    transparentPixels,
    cornerAlpha: corners,
    sourceSha256: entry.sha256,
    intake: "qa/character-production-v3/SUPPLIED-20260915/supplied-character-source-intake.json"
  };
}

for (const character of characters) {
  if (!["leon", "zaya", "elephant"].includes(character.id)) continue;
  character.status = "review-only";
  if (character.id === "leon") {
    character.notes = "Supplied 20260915 transparent poses are available for LOW, CALM, HAPPY and EXCITED. EMPTY has not been supplied and must be produced before Leon can be approved. Sources remain below the 2048 px production master requirement and are review-only.";
  } else if (character.id === "zaya") {
    character.notes = "Supplied 20260915 transparent poses cover all five states. Sources remain below the 2048 px production master requirement and require production rebuild/visual QA before approval.";
  } else if (character.id === "elephant") {
    character.notes = "Supplied 20260915 transparent poses cover all five states. Sources remain below the 2048 px production master requirement and require production rebuild/visual QA before approval.";
  }
}

const lionReference = (manifest.entries || []).find(entry => entry.character === "lion" && entry.state === "reference-sheet");
if (lionReference) {
  review.references ||= [];
  const existing = review.references.find(reference => reference.src === lionReference.sourcePath);
  if (!existing) {
    review.references.push({
      name: "Lion five-pose reference — supplied 20260915",
      src: lionReference.sourcePath,
      notes: "Multi-pose reference sheet only. Individual transparent production masters are still required."
    });
  }
}

review.status = "review-only";
review.productionApproved = false;
review.lastSuppliedIntake = manifestPath;

await fs.writeFile(path.join(root, reviewPath), `${JSON.stringify(review, null, 2)}\n`);
console.log("Synced 20260915 supplied character references into the internal review registry.");
