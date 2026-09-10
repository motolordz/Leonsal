import { verifyApprovalEvidence } from './character-approval-evidence.mjs';
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const registryPath = process.env.LEONSAL_REGISTRY_PATH || path.join(root, "data/character-assets.json");
const defaultRegistryPath = path.join(root, "data/character-assets.json");
const finalReviewDir = registryPath === defaultRegistryPath
  ? path.join(root, "qa/character-production-v3/FINAL-REVIEW")
  : path.join(path.dirname(registryPath), "FINAL-REVIEW");

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sha256(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

function relativePath(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function stateMap(assetRoot, file) {
  return Object.fromEntries(states.map((state) => [state, `${assetRoot}/${state}/${file}`]));
}

function allRecords(data) {
  return ["guides", "alphabet", "numbers", "world", "planets"].flatMap((family) => data[family] || []);
}

function findRecord(data, target) {
  for (const family of ["guides", "alphabet", "numbers", "world", "planets"]) {
    const index = (data[family] || []).findIndex((record) => record.id === target);
    if (index >= 0) return { family, index, record: data[family][index] };
  }
  return null;
}

async function inspectStateAssets(assetRoot) {
  const inspected = {};
  for (const state of states) {
    const master = path.join(root, assetRoot, state, "master.png");
    const web = path.join(root, assetRoot, state, "web.webp");
    if (!(await exists(master))) throw new Error(`Missing master for ${assetRoot}/${state}`);
    if (!(await exists(web))) throw new Error(`Missing web derivative for ${assetRoot}/${state}`);
    const meta = await sharp(master).metadata();
    inspected[state] = {
      masterPath: relativePath(master),
      webPath: relativePath(web),
      width: meta.width,
      height: meta.height,
      hasAlpha: Boolean(meta.hasAlpha),
      masterSha256: await sha256(master),
      webSha256: await sha256(web)
    };
  }
  return inspected;
}

async function assertApprovalEvidence(args, inspected) {
  if (!args["approval-evidence"]) {
    throw new Error("Approved assets require --approval-evidence. Technical validation alone cannot create production approval.");
  }
  const evidencePath = path.resolve(root, args["approval-evidence"]);
  if (!(await exists(evidencePath))) throw new Error(`Approval evidence does not exist: ${args["approval-evidence"]}`);
  return verifyApprovalEvidence(root, args["approval-evidence"], args.target, inspected, args["asset-version"]);
}

async function recordDimensions(record) {
  const masterPath = record.masterStates?.empty;
  if (!masterPath) return {};
  try {
    const meta = await sharp(path.join(root, masterPath)).metadata();
    return { width: meta.width, height: meta.height };
  } catch {
    return {};
  }
}

async function summarize(data) {
  const approved = [];
  const pending = [];
  const rejected = [];
  for (const record of allRecords(data)) {
    const target = record.status === "approved" ? approved : record.status === "rejected" ? rejected : pending;
    const stateSource = record.status === "approved" ? record.states || {} : record.reviewStates || record.masterStates || {};
    target.push({
      id: record.id,
      family: record.family,
      displayName: record.displayName,
      status: record.status,
      states: Object.keys(stateSource).length,
      ...(await recordDimensions(record)),
      evidence: record.evidence || [],
      reason: record.notes || ""
    });
  }
  return { approved, pending, rejected };
}

async function writeReports(data) {
  const { approved, pending, rejected } = await summarize(data);
  await fs.mkdir(finalReviewDir, { recursive: true });
  await fs.writeFile(path.join(finalReviewDir, "approved-assets.json"), JSON.stringify({
    approvedCharacterCount: approved.length,
    approvedStateAssetCount: approved.reduce((total, record) => total + record.states, 0),
    approved
  }, null, 2));
  await fs.writeFile(path.join(finalReviewDir, "failed-or-pending.json"), JSON.stringify({
    pendingCharacterCount: pending.length,
    pendingStateAssetCount: pending.reduce((total, record) => total + record.states, 0),
    rejectedCharacterCount: rejected.length,
    rejectedStateAssetCount: rejected.reduce((total, record) => total + record.states, 0),
    pending,
    rejected
  }, null, 2));
}

const args = parseArgs(process.argv.slice(2));
const data = JSON.parse(await fs.readFile(registryPath, "utf8"));

if (!args.target) {
  await writeReports(data);
  console.log("No --target supplied. Registry preserved; refreshed approval summary reports only.");
  process.exit(0);
}

const location = findRecord(data, args.target);
if (!location) throw new Error(`Unknown character id: ${args.target}`);

const status = args.status || "pending-art";
if (!["approved", "pending-art", "rejected"].includes(status)) throw new Error(`Unsupported status: ${status}`);
const assetRoot = args["asset-root"] || Object.values(location.record.masterStates || {})[0]?.replace(/\/empty\/master\.png$/, "");
if (!assetRoot) throw new Error(`Missing --asset-root for ${args.target}`);

const inspected = await inspectStateAssets(assetRoot);
const updated = {
  ...location.record,
  family: args.family || location.record.family,
  displayName: args["display-name"] || location.record.displayName,
  status,
  format: status === "approved" ? "png-rgba-production-v3" : location.record.format || "png-rgba-review-v3",
  states: status === "approved" ? stateMap(assetRoot, "web.webp") : {},
  masterStates: stateMap(assetRoot, "master.png"),
  evidence: [args.evidence || `qa/character-production-v3/${args.target}/five-states.png`],
  notes: args.notes || (status === "approved"
    ? "Approved production V3 asset set. Approval is bound to exact reviewed asset hashes and evidence."
    : status === "rejected"
      ? "Rejected for production runtime. Files may remain for review history only."
      : "Pending visual/owner approval. Runtime must resolve fallback, not these review assets."),
  approval: status === "approved" ? await assertApprovalEvidence(args, inspected) : undefined
};

if (status === "approved") {
  delete updated.reviewStates;
} else {
  updated.states = {};
  updated.reviewStates = stateMap(assetRoot, "web.webp");
  delete updated.approval;
}

data[location.family][location.index] = updated;
data.runtimeRule = "Only records with status approved may resolve state paths into runtime image sources. Pending-art and rejected records must expose no runtime state paths and must never load source-safe-keeping, review-only, QA, contact-sheet, or rejected assets.";
data.approvalGate = "Production approval requires exact evidence, bound asset hashes, five-state completeness, transparent masters, matching web derivatives, visual QA, identity consistency, runtime-source safety, and owner/autonomous gate authorization for the specific asset version.";

await fs.writeFile(registryPath, JSON.stringify(data, null, 2) + "\n");
await writeReports(data);
console.log(`Registered ${args.target} as ${status}.`);
