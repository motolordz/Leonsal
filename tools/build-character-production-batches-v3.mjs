import fs from "node:fs/promises";
import path from "node:path";

const outputDir = "qa/character-production-v3/READINESS";
const readiness = JSON.parse(await fs.readFile(path.join(outputDir, "character-readiness-report.json"), "utf8"));
const records = readiness.characters || [];
const review = JSON.parse(await fs.readFile("data/character-review.json", "utf8"));
const reviewRecords = review.characters || [];

const batchSpecs = [
  {
    id: "batch-1-guides-leon-zaya",
    title: "Complete Leon and Zaya five-state production artwork",
    familyFilter: (record) => record.family === "guide",
    priority: "P0",
    requiredEvidence: [
      "five production masters per guide",
      "web derivatives",
      "source/vector provenance",
      "mobile five-state render evidence",
      "visible uppercase LEON/ZAYA name treatment",
      "identity consistency sheet",
      "owner/autonomous approval evidence bound to exact hashes"
    ]
  },
  {
    id: "batch-2-supplied-world-poses",
    title: "Resolve supplied Elephant and related world pose candidates",
    familyFilter: (record) => record.id === "world-elephant" || record.displayName === "Elephant",
    priority: "P1",
    requiredEvidence: [
      "single-character transparent masters",
      "2048px production reconstruction or approved source upgrade",
      "five-state distinction",
      "identity consistency sheet",
      "runtime resolver proof"
    ]
  },
  {
    id: "batch-3-alphabet",
    title: "Complete A-Z five-state alphabet characters",
    familyFilter: (record) => record.family === "alphabet",
    priority: "P1",
    requiredEvidence: [
      "A-Z exact sequence",
      "glyph legibility on mobile",
      "five emotional states per letter",
      "no confusing b/d, p/q, m/n, u/v, I/l forms",
      "family contact sheet"
    ]
  },
  {
    id: "batch-4-numbers",
    title: "Complete 1-10 five-state number characters",
    familyFilter: (record) => record.family === "number",
    priority: "P1",
    requiredEvidence: [
      "1-10 numeric ordering",
      "10 treated as one number character",
      "mobile numeral legibility",
      "five emotional states per number",
      "family contact sheet"
    ]
  },
  {
    id: "batch-5-world",
    title: "Complete canonical world characters",
    familyFilter: (record) => record.family === "world" && record.id !== "battery-buddy",
    priority: "P2",
    requiredEvidence: [
      "object identity preserved",
      "five meaningful states where energy system applies",
      "no generic blob substitution",
      "family contact sheet",
      "game-context render smoke"
    ]
  },
  {
    id: "batch-6-planets",
    title: "Complete planet and space character candidates",
    familyFilter: (record) => record.family === "planet",
    priority: "P2",
    requiredEvidence: [
      "scientific visual identity preserved",
      "fictional personality separated from astronomy facts",
      "five expressive states",
      "orbit/world render smoke"
    ]
  }
];

function reviewRecordAsBatchCharacter(record) {
  const suppliedStates = Object.keys(record.states || {}).length;
  return {
    id: `supplied-${record.id}`,
    displayName: record.name,
    status: "review-only",
    registryStateSlots: 0,
    suppliedReviewStates: suppliedStates,
    blockers: [
      "not present in canonical production registry",
      suppliedStates === 5 ? "supplied five-state review set still needs production reconstruction" : `supplied source intake has ${suppliedStates}/5 states`,
      "supplied source is below 2048 px production master requirement"
    ],
    evidence: []
  };
}

const batches = batchSpecs.map((spec) => {
  let characters = records
    .filter(spec.familyFilter)
    .map((record) => ({
      id: record.id,
      displayName: record.displayName,
      status: record.status,
      registryStateSlots: record.registryStateSlots,
      suppliedReviewStates: record.suppliedReviewStates,
      blockers: record.blockers || [],
      evidence: record.evidence || []
    }));
  if (spec.id === "batch-2-supplied-world-poses") {
    const registryIds = new Set(records.map((record) => record.id));
    const nonCanonicalSupplied = reviewRecords
      .filter((record) => record.id === "elephant" && !registryIds.has(record.id) && !registryIds.has(`world-${record.id}`))
      .map(reviewRecordAsBatchCharacter);
    characters = [...characters, ...nonCanonicalSupplied];
  }
  return {
    id: spec.id,
    title: spec.title,
    priority: spec.priority,
    status: characters.every((record) => record.status === "approved") ? "complete" : "pending-production",
    characterCount: characters.length,
    stateAssetCount: characters.length * 5,
    requiredEvidence: spec.requiredEvidence,
    characters
  };
});

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "character-production-batches.json"), JSON.stringify({
  schemaVersion: 1,
  generatedFrom: "qa/character-production-v3/READINESS/character-readiness-report.json",
  runtimeRule: readiness.productionRule,
  batches
}, null, 2) + "\n");

await fs.writeFile(path.join(outputDir, "CHARACTER-PRODUCTION-BATCHES.md"), [
  "# Character Production Batches",
  "",
  "These batches are a production order, not a claim that the artwork is approved.",
  "",
  ...batches.flatMap((batch) => [
    `## ${batch.title}`,
    "",
    `- ID: ${batch.id}`,
    `- Priority: ${batch.priority}`,
    `- Status: ${batch.status}`,
    `- Characters: ${batch.characterCount}`,
    `- State assets: ${batch.stateAssetCount}`,
    `- First blockers: ${batch.characters.slice(0, 4).map((record) => `${record.displayName}: ${(record.blockers || [])[0] || "none"}`).join("; ") || "none"}`,
    ""
  ]),
  "## Runtime Rule",
  "",
  readiness.productionRule
].join("\n"));

console.log(`Character production batches written: ${batches.length} batches.`);
