import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = "qa/character-production-v3/GUIDE-PRODUCTION-LANE";
const states = ["empty", "low", "calm", "happy", "excited"];
const sourceSheets = {
  leon: "assets/source-safe-keeping/approved-character-sheets-v2/leon-five-state-large.jpg",
  zaya: "assets/source-safe-keeping/approved-character-sheets-v2/zaya-five-state-large.jpg"
};

const review = JSON.parse(await fs.readFile("data/character-review.json", "utf8"));
const registry = JSON.parse(await fs.readFile("data/character-assets.json", "utf8"));
const reviewById = new Map((review.characters || []).map((record) => [record.id, record]));
const guideById = new Map((registry.guides || []).map((record) => [record.id, record]));

function blockerSet(id, suppliedStates) {
  const blockers = [
    "not-production-approved",
    "current generated production candidates are below Battery Buddy V3 visual quality",
    "supplied individual references are 1254px review sources, below 2048px production master requirement"
  ];
  for (const state of states) {
    if (!suppliedStates.includes(state)) blockers.push(`missing-supplied-${state}-reference`);
  }
  if (id === "leon" && !suppliedStates.includes("empty")) {
    blockers.push("Leon empty state must be rebuilt from approved poster/reference material, not chart-cropped into runtime");
  }
  return blockers;
}

async function imageData(src, max = 220) {
  const full = path.resolve(src);
  const meta = await sharp(full).metadata();
  const resized = await sharp(full).resize({ width: max, height: max, fit: "inside", withoutEnlargement: false }).png().toBuffer();
  return { dataUri: `data:image/png;base64,${resized.toString("base64")}`, width: meta.width, height: meta.height };
}

async function buildRows(lane) {
  const rows = [];
  for (const record of lane.guides) {
    const cells = [];
    for (const state of states) {
      const stateRecord = reviewById.get(record.id)?.states?.[state];
      cells.push(stateRecord ? await imageData(stateRecord.source, 190) : null);
    }
    rows.push({ record, cells });
  }
  return rows;
}

const guides = ["leon", "zaya"].map((id) => {
  const supplied = reviewById.get(id);
  const suppliedStates = states.filter((state) => supplied?.states?.[state]);
  const registryRecord = guideById.get(id);
  return {
    id,
    displayName: registryRecord?.displayName || supplied?.name || id,
    productionStatus: registryRecord?.status || "missing",
    suppliedReviewStates: suppliedStates,
    missingSuppliedStates: states.filter((state) => !suppliedStates.includes(state)),
    posterReference: sourceSheets[id],
    suppliedSourceResolution: supplied ? Object.fromEntries(suppliedStates.map((state) => [
      state,
      {
        width: supplied.states[state].width,
        height: supplied.states[state].height,
        source: supplied.states[state].source,
        sourceSha256: supplied.states[state].sourceSha256
      }
    ])) : {},
    approvalDecision: "blocked",
    blockers: blockerSet(id, suppliedStates),
    nextProductionSteps: [
      "author or generate true individual 2048px transparent masters for all five states",
      "preserve visible uppercase name on clothing or a natural badge",
      "bind every accepted master to source hashes and visual QA evidence",
      "only then expose approved runtime web derivatives through data/character-assets.json"
    ]
  };
});

const lane = {
  schemaVersion: 1,
  status: "pending-production",
  runtimeRule: registry.runtimeRule,
  batteryPrecedent: "Battery Buddy V3 remains the only approved production character set.",
  guides
};

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, "guide-production-lane.json"), JSON.stringify(lane, null, 2) + "\n");

const rows = await buildRows(lane);
const sheetWidth = 1500;
const cellW = 230;
const rowH = 300;
const headerH = 180;
const sheetHeight = headerH + rows.length * rowH + 120;
const headings = states.map((state, index) => `<text x="${300 + index * cellW + cellW / 2}" y="150" text-anchor="middle" class="state">${state.toUpperCase()}</text>`).join("");
const rowMarkup = rows.map(({ record, cells }, rowIndex) => {
  const y = headerH + rowIndex * rowH;
  const cellMarkup = cells.map((cell, index) => {
    const x = 300 + index * cellW;
    if (!cell) {
      return `<g transform="translate(${x} ${y + 30})"><rect width="190" height="190" rx="28" fill="#fff4f4" stroke="#d34d5f" stroke-width="4"/><text x="95" y="88" text-anchor="middle" class="missing">MISSING</text><text x="95" y="122" text-anchor="middle" class="small">rebuild needed</text></g>`;
    }
    return `<g transform="translate(${x} ${y + 16})"><rect width="206" height="220" rx="30" fill="#f8fbff" stroke="#c8d9ef" stroke-width="3"/><image href="${cell.dataUri}" x="8" y="8" width="190" height="190" preserveAspectRatio="xMidYMid meet"/><text x="103" y="212" text-anchor="middle" class="small">${cell.width}x${cell.height} review</text></g>`;
  }).join("");
  return `<g><text x="72" y="${y + 110}" class="guide">${record.displayName}</text><text x="72" y="${y + 150}" class="blocked">${record.productionStatus}</text>${cellMarkup}</g>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}">
  <style>
    .title{font:900 48px Arial,sans-serif;fill:#102746}.note{font:700 24px Arial,sans-serif;fill:#47627f}.state{font:900 25px Arial,sans-serif;fill:#134984}.guide{font:900 34px Arial,sans-serif;fill:#102746}.blocked{font:800 20px Arial,sans-serif;fill:#b04657}.missing{font:900 26px Arial,sans-serif;fill:#b04657}.small{font:700 18px Arial,sans-serif;fill:#5d7188}
  </style>
  <rect width="100%" height="100%" fill="#eef7ff"/>
  <text x="70" y="70" class="title">LeonSal Guide Production Lane</text>
  <text x="70" y="112" class="note">Review evidence only. Production runtime remains fail-closed until true approved masters exist.</text>
  ${headings}
  ${rowMarkup}
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, "guide-production-lane.png"));

await fs.writeFile(path.join(outDir, "GUIDE-PRODUCTION-LANE.md"), [
  "# Guide Production Lane",
  "",
  "Leon and Zaya are still pending production approval. This evidence exists to drive the next artwork pass; it is not runtime approval.",
  "",
  ...guides.flatMap((guide) => [
    `## ${guide.displayName}`,
    "",
    `- Status: ${guide.productionStatus}`,
    `- Supplied review states: ${guide.suppliedReviewStates.join(", ") || "none"}`,
    `- Missing supplied states: ${guide.missingSuppliedStates.join(", ") || "none"}`,
    `- Poster/reference sheet: ${guide.posterReference}`,
    `- First blocker: ${guide.blockers[0]}`,
    ""
  ]),
  "## Evidence",
  "",
  "- qa/character-production-v3/GUIDE-PRODUCTION-LANE/guide-production-lane.png",
  "- qa/character-production-v3/GUIDE-PRODUCTION-LANE/guide-production-lane.json"
].join("\n"));

console.log(`Guide production lane written to ${outDir}`);
