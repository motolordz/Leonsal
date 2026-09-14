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
    if (/below (?:the )?2048 px production (?:master )?requirement/i.test(supplied.notes || "")) blockers.push("supplied source is below 2048 px production master requirement");
  }
  if (record.id === "leon") blockers.push("Leon empty generation attempts failed real-alpha gate");
  if (record.family === "guide" && record.status !== "approved") {
    blockers.push("guide art workflow has style-direction evidence but built-in generation failed transparent 2048px masters");
  }
  if (/procedural review artwork|does not yet match Battery Buddy/i.test(record.notes || "")) blockers.push("visual quality below Battery Buddy V3 precedent");
  return [...new Set(blockers)];
}

function gatesFor(record, supplied, presentStates, suppliedStates) {
  const generatedQualityPending = /procedural review artwork|does not yet match Battery Buddy/i.test(record.notes || "");
  const sourceTooSmall = supplied && /below (?:the )?2048 px production (?:master )?requirement/i.test(supplied.notes || "");
  const guideNameNeedsCleanup = supplied && /canonical uppercase name|clothing needs/i.test(supplied.notes || "");
  const leonEmptyBlocked = record.id === "leon";
  const isApproved = record.status === "approved";
  return {
    fiveStateComplete: presentStates.length === states.length ? "pass" : "fail",
    suppliedSourceComplete: !supplied ? "not-applicable" : suppliedStates.length === states.length ? "pass" : "fail",
    productionResolution: isApproved ? "pass" : sourceTooSmall ? "fail" : "pending",
    transparentMasters: isApproved ? "pass" : presentStates.length === states.length ? "technical-pass" : "pending",
    runtimeExposure: Object.keys(record.states || {}).length === (isApproved ? states.length : 0) ? "pass" : "fail",
    visualQuality: isApproved ? "pass" : generatedQualityPending ? "fail" : "pending",
    identityConsistency: isApproved ? "pass" : "pending-visual-review",
    guideNameText: record.family !== "guide" ? "not-applicable" : guideNameNeedsCleanup || leonEmptyBlocked ? "fail" : "pending",
    approvalStatus: isApproved ? "approved" : "blocked"
  };
}

const characters = registryRecords.map((record) => {
  const supplied = reviewFor(record.id);
  const stateSource = record.status === "approved" ? record.states : record.reviewStates || record.masterStates || {};
  const presentStates = states.filter((state) => Boolean(stateSource[state]));
  const suppliedStates = supplied ? states.filter((state) => Boolean(supplied.states?.[state])) : [];
  return {
    id: record.id,
    displayName: record.displayName,
    family: record.family,
    status: record.status,
    productionRuntimeStates: record.status === "approved" ? Object.keys(record.states || {}).length : 0,
    registryStateSlots: presentStates.length,
    suppliedReviewStates: suppliedStates.length,
    gates: gatesFor(record, supplied, presentStates, suppliedStates),
    evidence: record.evidence || [],
    blockers: blockersFor(record)
  };
});

const familySummary = Object.fromEntries(["guide", "alphabet", "number", "world", "planet"].map((family) => {
  const items = characters.filter((record) => record.family === family);
  const blockerCounts = new Map();
  for (const item of items) {
    for (const blocker of item.blockers) blockerCounts.set(blocker, (blockerCounts.get(blocker) || 0) + 1);
  }
  return [family, {
    characterCount: items.length,
    approvedCharacters: items.filter((record) => record.status === "approved").length,
    pendingCharacters: items.filter((record) => record.status !== "approved").length,
    approvedRuntimeStateAssets: items.reduce((total, record) => total + record.productionRuntimeStates, 0),
    pendingStateSlots: items
      .filter((record) => record.status !== "approved")
      .reduce((total, record) => total + record.registryStateSlots, 0),
    suppliedReviewStateAssets: items.reduce((total, record) => total + record.suppliedReviewStates, 0),
    gateSummary: {
      approved: items.filter((record) => record.gates.approvalStatus === "approved").length,
      blocked: items.filter((record) => record.gates.approvalStatus === "blocked").length,
      visualQualityFailed: items.filter((record) => record.gates.visualQuality === "fail").length,
      runtimeExposurePassed: items.filter((record) => record.gates.runtimeExposure === "pass").length
    },
    topBlockers: [...blockerCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([blocker, count]) => ({ blocker, count }))
  }];
}));

const summary = {
  approvedCharacters: characters.filter((record) => record.status === "approved").length,
  approvedRuntimeStateAssets: characters.reduce((total, record) => total + record.productionRuntimeStates, 0),
  pendingCharacters: characters.filter((record) => record.status !== "approved").length,
  pendingGeneratedVectorSources: characters
    .filter((record) => record.status !== "approved")
    .reduce((total, record) => total + record.registryStateSlots, 0),
  suppliedReviewCharacters: reviewRecords.length,
  suppliedReviewStateAssets: reviewRecords.reduce((total, record) => total + Object.keys(record.states || {}).length, 0),
  missingSuppliedStates: reviewRecords.flatMap((record) => states
    .filter((state) => !record.states?.[state])
    .map((state) => ({ character: record.id, state }))),
  failedGeneratedAttempts: [
    "qa/character-production-v3/leon/failed-generated-empty/report.json",
    "qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/pilot-report.json"
  ],
  guideStyleDirectionEvidence: [
    "qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/leon-zaya-five-state-generated-review.png",
    "qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/character-review-guide-pilot-390.png"
  ]
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "character-readiness-report.json"), JSON.stringify({
  schemaVersion: 1,
  productionRule: registry.runtimeRule,
  summary,
  familySummary,
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
  `- Guide style-direction evidence: ${summary.guideStyleDirectionEvidence.length}`,
  "",
  "## Family Status",
  "",
  ...Object.entries(familySummary).map(([family, item]) => `- ${family}: ${item.approvedCharacters}/${item.characterCount} approved; ${item.pendingStateSlots} pending state slots; top blocker: ${item.topBlockers[0]?.blocker || "none"}`),
  "",
  "## Immediate Blockers",
  "",
  ...characters
    .filter((record) => record.blockers.length)
    .slice(0, 12)
    .map((record) => `- ${record.displayName}: ${record.blockers.join("; ")}`),
  "",
  "## Guide Art Method Status",
  "",
  "The latest Leon/Zaya generation produced useful style-direction evidence but did not produce production masters. The review sheet, individual Leon attempt and background-extraction edit all failed real-alpha production requirements, and the individual outputs remain below the 2048 px master-size floor.",
  "",
  "## Runtime Rule",
  "",
  registry.runtimeRule
].join("\n"));

console.log(`Character readiness report written to ${outputDir}/character-readiness-report.json`);
