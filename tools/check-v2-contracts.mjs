import fs from "node:fs";

const failures = [];

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const exists = (file) => {
  if (!fs.existsSync(file)) failures.push(`${file}: missing`);
};

exists("docs/LEONSAL_INTERACTION_ENGINE_BIBLE.md");
exists("docs/LEONSAL_SENSORY_EXPERIENCE_BIBLE.md");
exists("docs/LEONSAL_SENSORY_MIXER_SPEC.md");

const engineContracts = readJson("data/engine-contracts-v2.json");
const currentEngines = readJson("data/engines-v2.json");
const sensoryConcepts = readJson("data/sensory-concepts-v2.json");
const mixer = readJson("data/sensory-mixer-contract-v2.json");
const workItems = readJson("data/runtime-work-items-v2.json");
const games = readJson("data/games-v2.json");

if (engineContracts.counts?.totalSpecifications !== 28) {
  failures.push("engine-contracts-v2.json: expected 28 engine specifications");
}
if (engineContracts.counts?.implementedProof !== 20) {
  failures.push("engine-contracts-v2.json: expected 20 implemented-proof engines");
}
if (engineContracts.counts?.specifiedOnly !== 8) {
  failures.push("engine-contracts-v2.json: expected 8 specified-only engines");
}

const currentIds = currentEngines.engines.map((engine) => engine.id);
const contractFirst20 = engineContracts.engines.slice(0, 20).map((engine) => engine.id);
if (JSON.stringify(currentIds) !== JSON.stringify(contractFirst20)) {
  failures.push("engine-contracts-v2.json: first 20 engine IDs must match data/engines-v2.json exactly");
}

const specOnly = engineContracts.engines.filter((engine) => engine.contractStatus === "specified-only");
if (specOnly.length !== 8) {
  failures.push("engine-contracts-v2.json: specified-only engine count mismatch");
}

if (sensoryConcepts.conceptCount !== 56 || sensoryConcepts.concepts?.length !== 56) {
  failures.push("sensory-concepts-v2.json: expected 56 catalogue concepts");
}
if (sensoryConcepts.completedGameCount !== 0) {
  failures.push("sensory-concepts-v2.json: catalogue concepts must not count as completed games");
}
for (const concept of sensoryConcepts.concepts || []) {
  if (concept.completedGame !== false || concept.status !== "catalogue-only") {
    failures.push(`sensory-concepts-v2.json: ${concept.id} must remain catalogue-only`);
  }
}

if (mixer.implementationStatus !== "specified-only") {
  failures.push("sensory-mixer-contract-v2.json: Mixer must remain specified-only");
}

if (games.total !== 30 || games.games?.length !== 30) {
  failures.push("games-v2.json: expected 30 catalogue entries");
}
if (games.liveV2GameCount !== 0) {
  failures.push("games-v2.json: V2 map must not count catalogue/proof routes as live games");
}
for (const game of games.games || []) {
  if (game.liveV2Game !== false) failures.push(`games-v2.json: ${game.id} must not be counted as a live V2 game`);
  if (!game.status) failures.push(`games-v2.json: ${game.id} must declare a status`);
}

const batFace = workItems.items?.find((item) => item.id === "BAT-FACE-001");
const dashEnergy = workItems.items?.find((item) => item.id === "DASH-ENERGY-001");
if (!batFace || !["open", "closed-with-owner-review-evidence"].includes(batFace.status)) {
  failures.push("runtime-work-items-v2.json: BAT-FACE-001 must remain tracked");
}
if (batFace.status === "closed-with-owner-review-evidence") {
  for (const evidence of batFace.evidence || []) {
    if (!fs.existsSync(evidence)) failures.push(`runtime-work-items-v2.json: BAT-FACE-001 evidence missing ${evidence}`);
  }
}
if (!dashEnergy || dashEnergy.status !== "contract-preserved") {
  failures.push("runtime-work-items-v2.json: DASH-ENERGY-001 must remain explicit");
}

if (failures.length) {
  console.error("V2 contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V2 contract check passed: 28 engine specs, 56 sensory catalogue concepts, Mixer specified-only.");
