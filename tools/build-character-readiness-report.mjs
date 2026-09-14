import fs from "node:fs/promises";
import path from "node:path";

const states = ["empty", "low", "calm", "happy", "excited"];
const outputDir = "qa/character-production-v3/READINESS";

const registry = JSON.parse(await fs.readFile("data/character-assets.json", "utf8"));
const review = JSON.parse(await fs.readFile("data/character-review.json", "utf8"));

const registryRecords = ["guides", "alphabet", "numbers", "world", "planets"]
  .flatMap((family) => (registry[family] || []).map((record) => ({ ...record, registryGroup: family })));
const reviewRecords = review.characters || [];

function reviewFor(id) {
  return reviewRecords.find((record) => record.id === id || record.id === id.replace(/^world-/, ""));
}

function blockersFor(record) {
  const blockers = [];
  const supplied = reviewFor(record.id);
  const stateSource = record.status === "approved" ? record.states : record.reviewStates || record.masterStates || {};
  const presentStates = states.filter((state) => Boolean(stateSource[state]));
  if (record.status !== "approved") blockers.push("not approved for production runtime");
  if (presentStates.length !== states.length) blockers.push(`registry has ${presentStates.length}/5 state paths`);
  if (supplied) {
    const suppliedStates = states.filter((state) => Boolean(supplied.states?.[state]));
    if (suppliedStates.length !== states.length) blockers.push(`supplied source intake has ${suppliedStates.length}/5 states`);
    if (/canonical uppercase name|clothing needs/i.test(supplied.notes || "")) blockers.push("guide clothing/name text needs production cleanup");
    if (/below the 2048 px production requirement/i.test(supplied.notes || "")) blockers.push("supplied source is below 2048 px production master requirement");
  }
  if (record.id === "leon") blockers.push("Leon empty generation attempts failed real-alpha gate");
  if (/procedural review artwork|does not yet match Battery Buddy/i.test(record.notes || "")) blockers.push("visual quality below Battery Buddy V3 precedent");
  return [...new Set(blockers)];
}

const characters = registryRecords.map((record) => {
  const supplied = reviewFor(record.id);
  const stateSource = record.status === "approved" ? record.states : record.reviewStates || record.masterStates || {};
  return {
    id: record.id,
    displayName: record.displayName,
    family: record.family,
    status: record.status,
    productionRuntimeStates: record.status === "approved" ? Object.keys(record.states || {}).length : 0,
    registryStateSlots: states.filter((state) => Boolean(stateSource[state])).length,
    suppliedReviewStates: supplied ? states.filter((state) => Boolean(supplied.states?.[state])).length : 0,
    evidence: record.evidence || [],
    blockers: blockersFor(record)
  };
});

const summary = {
  approvedCharacters: characters.filter((record) => record.status === "approved").length,
  approvedRuntimeStateAssets: characters.reduce((total, record) => total + record.productionRuntimeStates, 0),
  pendingCharacters: characters.filter((record) => record.status !== "approved").length,
  suppliedReviewCharacters: reviewRecords.length,
  suppliedReviewStateAssets: reviewRecords.reduce((total, record) => total + Object.keys(record.states || {}).length, 0),
  missingSuppliedStates: reviewRecords.flatMap((record) => states
    .filter((state) => !record.states?.[state])
    .map((state) => ({ character: record.id, state }))),
  failedGeneratedAttempts: [
    "qa/character-production-v3/leon/failed-generated-empty/report.json"
  ]
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "character-readiness-report.json"), JSON.stringify({
  schemaVersion: 1,
  productionRule: registry.runtimeRule,
  summary,
  characters
}, null, 2) + "\n");

await fs.writeFile(path.join(outputDir, "CHARACTER-READINESS.md"), [
  "# LeonSal Character Readiness",
  "",
  "This report separates artwork that exists for review from artwork approved for production runtime.",
  "",
  `- Approved production characters: ${summary.approvedCharacters}`,
  `- Approved runtime state assets: ${summary.approvedRuntimeStateAssets}`,
  `- Pending characters: ${summary.pendingCharacters}`,
  `- Supplied review characters: ${summary.suppliedReviewCharacters}`,
  `- Supplied review state assets: ${summary.suppliedReviewStateAssets}`,
  "",
  "## Immediate Blockers",
  "",
  ...characters
    .filter((record) => record.blockers.length)
    .slice(0, 12)
    .map((record) => `- ${record.displayName}: ${record.blockers.join("; ")}`),
  "",
  "## Runtime Rule",
  "",
  registry.runtimeRule
].join("\n"));

console.log(`Character readiness report written to ${outputDir}/character-readiness-report.json`);
