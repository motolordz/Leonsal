import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "qa/character-production-v3/PRODUCTION-QUEUE");
const states = ["empty", "low", "calm", "happy", "excited"];
const familyPriority = new Map([
  ["guide", "P0"],
  ["world", "P1"],
  ["alphabet", "P1"],
  ["number", "P1"],
  ["planet", "P2"]
]);
const familyOrder = new Map([
  ["guide", 0],
  ["world", 1],
  ["alphabet", 2],
  ["number", 3],
  ["planet", 4]
]);

const readiness = JSON.parse(await fs.readFile(path.join(root, "qa/character-production-v3/READINESS/character-readiness-report.json"), "utf8"));
const registry = JSON.parse(await fs.readFile(path.join(root, "data/character-assets.json"), "utf8"));

function registryRecords() {
  return ["guides", "alphabet", "numbers", "world", "planets"]
    .flatMap((group) => (registry[group] || []).map((record) => ({ ...record, registryGroup: group })));
}

function stateSlotsFor(record) {
  const source = record.status === "approved" ? record.states : record.reviewStates || record.masterStates || {};
  return Object.fromEntries(states.map((state) => [state, Boolean(source[state])]));
}

function canonicalAssetRoot(record) {
  if (record.id === "leon" || record.id === "zaya") return `assets/characters-v2/${record.id}`;
  if (record.family === "alphabet") return `assets/characters-v2/alphabet/${record.id.replace("letter-", "")}`;
  if (record.family === "number") return `assets/characters-v2/numbers/${record.id.replace("number-", "")}`;
  if (record.family === "planet") return `assets/characters-v2/planets/${record.id.replace("planet-", "")}`;
  if (record.id === "battery-buddy") return "assets/characters-v2/battery";
  return `assets/characters-v2/${record.id.replace(/^world-/, "")}`;
}

function sortKey(record) {
  const family = familyOrder.get(record.family) ?? 9;
  const id = record.id;
  if (record.family === "alphabet") return `${family}-${id.replace("letter-", "").padStart(2, "0")}`;
  if (record.family === "number") return `${family}-${String(Number(id.replace("number-", ""))).padStart(2, "0")}`;
  return `${family}-${id}`;
}

function nextActionFor(item) {
  if (item.id === "leon") {
    return "Build or source a real Leon EMPTY production state first, then rebuild all five guide states to one canonical model with visible LEON text.";
  }
  if (item.id === "zaya") {
    return "Rebuild Zaya from the supplied five-state reference into 2048px production masters with consistent identity and visible ZAYA text.";
  }
  if (item.family === "alphabet") {
    return "Upgrade the readable vector letter into a production-quality character while preserving exact uppercase glyph identity.";
  }
  if (item.family === "number") {
    return "Upgrade the readable vector number into a production-quality character while preserving exact numeral identity.";
  }
  if (item.family === "planet") {
    return "Create production planet character states without changing scientifically recognisable visual identity.";
  }
  return "Create production-quality five-state character art that preserves object identity and passes visual QA.";
}

const recordsById = new Map(registryRecords().map((record) => [record.id, record]));
const queue = (readiness.characters || [])
  .filter((item) => item.status !== "approved")
  .map((item) => {
    const record = recordsById.get(item.id) || item;
    const assetRoot = canonicalAssetRoot(record);
    return {
      id: item.id,
      displayName: item.displayName,
      family: item.family,
      priority: familyPriority.get(item.family) || "P2",
      status: "pending-production",
      stateSlots: stateSlotsFor(record),
      blockers: item.blockers || [],
      nextAction: nextActionFor(item),
      allowedSourceUse: "Reference only until rebuilt/redrawn into approved production masters; review, QA, source-safe and contact-sheet paths must not be runtime sources.",
      requiredOutputs: states.flatMap((state) => [
        `${assetRoot}/${state}/master.png`,
        `${assetRoot}/${state}/web.webp`
      ]),
      requiredEvidence: [
        `qa/character-production-v3/${item.id}/five-states.png`,
        `qa/character-production-v3/${item.id}/identity-consistency.png`,
        `qa/character-production-v3/${item.id}/mobile-five-states.png`,
        `qa/character-production-v3/${item.id}/visual-acceptance.json`
      ]
    };
  })
  .sort((left, right) => sortKey(left).localeCompare(sortKey(right)));

const summary = {
  schemaVersion: 1,
  generatedFrom: "qa/character-production-v3/READINESS/character-readiness-report.json",
  runtimeRule: readiness.productionRule,
  approvedRuntimeStateAssets: readiness.summary?.approvedRuntimeStateAssets || 0,
  pendingCharacters: queue.length,
  pendingStateAssets: queue.length * states.length,
  priorities: Object.fromEntries(["P0", "P1", "P2"].map((priority) => [
    priority,
    queue.filter((item) => item.priority === priority).length
  ])),
  families: Object.fromEntries(["guide", "world", "alphabet", "number", "planet"].map((family) => [
    family,
    queue.filter((item) => item.family === family).length
  ]))
};

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, "character-production-queue.json"), JSON.stringify({ ...summary, queue }, null, 2) + "\n");

const lines = [
  "# Character Production Queue V3",
  "",
  "This queue turns the character mission into reviewable production work. It is not a production approval list.",
  "",
  `- Approved runtime state assets: ${summary.approvedRuntimeStateAssets}`,
  `- Pending production characters: ${summary.pendingCharacters}`,
  `- Pending state assets: ${summary.pendingStateAssets}`,
  `- Priority split: P0 ${summary.priorities.P0}, P1 ${summary.priorities.P1}, P2 ${summary.priorities.P2}`,
  "",
  "## Rules",
  "",
  "- Battery Buddy remains the only approved production character unless a later state passes all gates.",
  "- Pending entries may use supplied artwork as visual reference only.",
  "- Runtime image paths must stay empty until approval.",
  "- Each approved character needs five masters, five web derivatives, identity evidence, mobile evidence, and visual acceptance JSON.",
  "",
  "## Queue",
  "",
  ...queue.flatMap((item, index) => [
    `### ${index + 1}. ${item.displayName}`,
    "",
    `- ID: ${item.id}`,
    `- Family: ${item.family}`,
    `- Priority: ${item.priority}`,
    `- Status: ${item.status}`,
    `- Next action: ${item.nextAction}`,
    `- First blocker: ${item.blockers[0] || "none"}`,
    `- Required output root: ${canonicalAssetRoot(item)}`,
    ""
  ])
];

await fs.writeFile(path.join(outDir, "CHARACTER-PRODUCTION-QUEUE.md"), lines.join("\n"));
console.log(`Character production queue written: ${queue.length} characters, ${summary.pendingStateAssets} state assets.`);
