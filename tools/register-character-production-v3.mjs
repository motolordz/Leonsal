import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const registryPath = path.join(root, "data/character-assets.json");
const alphabet = JSON.parse(await fs.readFile(path.join(root, "data/alphabet.json"), "utf8"));
const numbers = JSON.parse(await fs.readFile(path.join(root, "data/numbers.json"), "utf8"));
const world = JSON.parse(await fs.readFile(path.join(root, "data/world-characters.json"), "utf8"));
const planets = JSON.parse(await fs.readFile(path.join(root, "data/planets.json"), "utf8"));

function stateMap(assetRoot, file = "web.webp") {
  return Object.fromEntries(states.map((state) => [state, `${assetRoot}/${state}/${file}`]));
}

async function dimensions(assetRoot) {
  const meta = await sharp(path.join(root, assetRoot, "empty", "master.png")).metadata();
  return { width: meta.width, height: meta.height };
}

function characterRecord({ id, displayName, family, assetRoot, sourceReference, learningRoles = [], status = "approved", notes, extra = {} }) {
  const approved = status === "approved";
  return {
    id,
    displayName,
    family,
    status,
    format: "png-rgba-production-v3",
    states: approved ? stateMap(assetRoot, "web.webp") : {},
    masterStates: stateMap(assetRoot, "master.png"),
    ...(approved ? {} : { reviewStates: stateMap(assetRoot, "web.webp") }),
    notes: notes || "Autonomous production V3 asset: transparent individual five-state master set generated from canonical repository identity/reference data and passed objective QA gates.",
    sourceReference,
    learningRoles,
    evidence: [`qa/character-production-v3/${id}/five-states.png`],
    ...extra
  };
}

const data = JSON.parse(await fs.readFile(registryPath, "utf8"));
const battery = data.world.find((record) => record.id === "battery-buddy");
if (!battery || battery.status !== "approved") throw new Error("Battery Buddy V3 must already be approved before registering the full library.");

data.guides = [
  characterRecord({ id: "leon", displayName: "Leon", family: "guide", assetRoot: "assets/characters-v2/leon", sourceReference: "data/characters.json#guide-leon", status: "pending-art", notes: "Generated V3 review asset set passes technical transparency gates but remains pending because visual QA found it does not yet match Battery Buddy V3 production illustration quality.", extra: { requiredNameText: "LEON" } }),
  characterRecord({ id: "zaya", displayName: "Zaya", family: "guide", assetRoot: "assets/characters-v2/zaya", sourceReference: "data/characters.json#guide-zaya", status: "pending-art", notes: "Generated V3 review asset set passes technical transparency gates but remains pending because visual QA found it does not yet match Battery Buddy V3 production illustration quality.", extra: { requiredNameText: "ZAYA" } })
];

data.alphabet = alphabet.map((item) => characterRecord({
  id: item.id,
  displayName: `Letter ${item.uppercase}`,
  family: "alphabet",
  assetRoot: `assets/characters-v2/alphabet/${item.id.replace("letter-", "")}`,
  sourceReference: "data/alphabet.json",
  status: "pending-art",
  notes: "Generated V3 review asset set is transparent and legible, but remains pending because it is procedural review artwork rather than Battery Buddy V3-level production illustration.",
  extra: { uppercase: item.uppercase, lowercase: item.lowercase, exampleWord: item.exampleWord }
}));

data.numbers = numbers.map((item) => characterRecord({
  id: item.id,
  displayName: `Number ${item.value}`,
  family: "number",
  assetRoot: `assets/characters-v2/numbers/${item.value}`,
  sourceReference: "data/numbers.json",
  status: "pending-art",
  notes: "Generated V3 review asset set is transparent and numerically legible, but remains pending because it is procedural review artwork rather than Battery Buddy V3-level production illustration.",
  extra: { value: item.value, quantity: item.quantity }
}));

const batteryRecord = data.world.find((record) => record.id === "battery-buddy");
const worldRecords = world.map((item) => {
  if (item.id === "world-battery" || item.id === "battery-buddy") return batteryRecord;
  const simpleId = item.id.replace(/^world-/, "");
  return characterRecord({
    id: item.id,
    displayName: item.displayName,
    family: "world",
    assetRoot: `assets/characters-v2/world/${simpleId}`,
    sourceReference: "data/world-characters.json",
    status: "pending-art",
    notes: "Generated V3 review asset set is transparent and single-character, but remains pending because visual QA found the simplified procedural world artwork below Battery Buddy V3 production quality.",
    learningRoles: item.learningRoles || []
  });
});
data.world = worldRecords.some((record) => record.id === "battery-buddy") ? worldRecords : [batteryRecord, ...worldRecords];

data.planets = planets.map((item) => characterRecord({
  id: item.characterId,
  displayName: item.displayName,
  family: "planet",
  assetRoot: `assets/characters-v2/planets/${item.id}`,
  sourceReference: "data/planets.json",
  status: "pending-art",
  notes: "Generated V3 review asset set preserves planet identity and transparency, but remains pending because it is not Battery Buddy V3-level production illustration.",
  learningRoles: [item.personality?.learningRole].filter(Boolean),
  extra: { astronomy: item.astronomy, planetId: item.id }
}));

data.families = ["guide", "world", "alphabet", "number", "planet"];
data.statuses = ["approved", "pending-art", "rejected"];
data.runtimeRule = "Only records with status approved may resolve state paths into runtime image sources. Approved paths must be individual production derivatives from matching transparent masters and must not point into source-safe-keeping, review-only, QA, contact-sheet, or rejected folders.";
data.approvalGate = "V3 autonomous production approval requires five-state completeness, transparent masters, web derivatives, visual QA evidence, identity consistency, and runtime-source safety.";
data.missing = [];

const approved = [];
const pending = [];
for (const family of ["guides", "alphabet", "numbers", "world", "planets"]) {
  for (const record of data[family] || []) {
    const assetRoot = Object.values(record.masterStates || {})[0]?.replace(/\/empty\/master\.png$/, "");
    const dim = assetRoot ? await dimensions(assetRoot) : {};
    const target = record.status === "approved" ? approved : pending;
    target.push({ id: record.id, family: record.family, displayName: record.displayName, status: record.status, states: states.length, ...dim, evidence: record.evidence, reason: record.notes });
  }
}

await fs.mkdir(path.join(root, "qa/character-production-v3/FINAL-REVIEW"), { recursive: true });
await fs.writeFile(path.join(root, "qa/character-production-v3/FINAL-REVIEW/approved-assets.json"), JSON.stringify({ approvedCharacterCount: approved.length, approvedStateAssetCount: approved.length * states.length, approved }, null, 2));
await fs.writeFile(path.join(root, "qa/character-production-v3/FINAL-REVIEW/failed-or-pending.json"), JSON.stringify({ pendingCharacterCount: pending.length, pendingStateAssetCount: pending.length * states.length, rejected: [], pending }, null, 2));
await fs.writeFile(registryPath, JSON.stringify(data, null, 2) + "\n");
console.log(`Registered ${approved.length} approved characters (${approved.length * states.length} approved state assets) and ${pending.length} pending/review characters (${pending.length * states.length} pending state assets).`);
