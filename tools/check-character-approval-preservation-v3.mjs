import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const registryPath = path.join(root, "data/character-assets.json");
const batteryFiles = states.flatMap((state) => [
  `assets/characters-v2/battery/${state}/master.png`,
  `assets/characters-v2/battery/${state}/web.webp`
]);

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, filePath))).digest("hex");
}

function run(args, env = {}) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const beforeBattery = Object.fromEntries(batteryFiles.map((file) => [file, sha256(file)]));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "leonsal-approval-"));
const tempRegistry = path.join(tempDir, "character-assets.json");
fs.copyFileSync(registryPath, tempRegistry);
const originalTempHash = sha256(path.relative(root, registryPath));

const reportOnly = run(["tools/register-character-production-v3.mjs"], { LEONSAL_REGISTRY_PATH: tempRegistry });
assert(reportOnly.status === 0, `report-only register failed: ${reportOnly.stderr || reportOnly.stdout}`);
const afterReportOnly = crypto.createHash("sha256").update(fs.readFileSync(tempRegistry)).digest("hex");
const originalCopied = crypto.createHash("sha256").update(fs.readFileSync(registryPath)).digest("hex");
assert(afterReportOnly === originalCopied, "report-only registration changed registry data");

const reportOnlyAgain = run(["tools/register-character-production-v3.mjs"], { LEONSAL_REGISTRY_PATH: tempRegistry });
assert(reportOnlyAgain.status === 0, `second report-only register failed: ${reportOnlyAgain.stderr || reportOnlyAgain.stdout}`);
const afterReportOnlyAgain = crypto.createHash("sha256").update(fs.readFileSync(tempRegistry)).digest("hex");
assert(afterReportOnlyAgain === afterReportOnly, "report-only registration is not idempotent");

const illegalApproval = run([
  "tools/register-character-production-v3.mjs",
  "--target", "leon",
  "--status", "approved",
  "--asset-root", "assets/characters-v2/leon"
], { LEONSAL_REGISTRY_PATH: tempRegistry });
assert(illegalApproval.status !== 0, "approved registration without approval evidence unexpectedly succeeded");

const pendingRegistration = run([
  "tools/register-character-production-v3.mjs",
  "--target", "leon",
  "--status", "pending-art",
  "--asset-root", "assets/characters-v2/leon",
  "--evidence", "qa/character-production-v3/leon/five-states.png"
], { LEONSAL_REGISTRY_PATH: tempRegistry });
assert(pendingRegistration.status === 0, `pending registration failed: ${pendingRegistration.stderr || pendingRegistration.stdout}`);

const tempData = JSON.parse(fs.readFileSync(tempRegistry, "utf8"));
const leon = tempData.guides.find((record) => record.id === "leon");
const battery = tempData.world.find((record) => record.id === "battery-buddy");
assert(leon.status === "pending-art", "Leon did not remain pending-art");
assert(Object.keys(leon.states || {}).length === 0, "Pending Leon exposes runtime states");
assert(Object.keys(leon.reviewStates || {}).length === states.length, "Pending Leon did not preserve review state paths");
assert(battery.status === "approved", "Battery approval was changed");
assert(Object.keys(battery.states || {}).length === states.length, "Battery runtime states were not preserved");


const unrelatedBefore = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
for (const family of ['guides','alphabet','numbers','world','planets']) {
  for (const original of unrelatedBefore[family] || []) {
    if (original.id === 'leon') continue;
    assert(JSON.stringify(original) === JSON.stringify(tempData[family].find(record => record.id === original.id)), `Unrelated record changed: ${original.id}`);
  }
}
const pendingBytes = fs.readFileSync(tempRegistry, 'utf8');
const repeated = run(['tools/register-character-production-v3.mjs','--target','leon','--asset-root','assets/characters-v2/leon','--evidence','qa/character-production-v3/leon/five-states.png'], {LEONSAL_REGISTRY_PATH:tempRegistry});
assert(repeated.status === 0, 'Repeated pending registration failed');
assert(fs.readFileSync(tempRegistry,'utf8') === pendingBytes, 'Targeted registration is not idempotent');
const arbitraryEvidence = path.join(tempDir,'arbitrary-evidence.txt');
fs.writeFileSync(arbitraryEvidence,'This is not an approval.');
const arbitrary = run(['tools/register-character-production-v3.mjs','--target','leon','--status','approved','--asset-root','assets/characters-v2/leon','--approval-evidence',arbitraryEvidence], {LEONSAL_REGISTRY_PATH:tempRegistry});
assert(arbitrary.status !== 0, 'Arbitrary existing file incorrectly granted approval');

const afterBattery = Object.fromEntries(batteryFiles.map((file) => [file, sha256(file)]));
assert(JSON.stringify(beforeBattery) === JSON.stringify(afterBattery), "Battery master/derivative bytes changed");
assert(originalTempHash === crypto.createHash("sha256").update(fs.readFileSync(registryPath)).digest("hex"), "Live registry changed during preservation test");

const outPath = path.join(root, "qa/character-production-v3/FINAL-REVIEW/approval-preservation-v3.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({
  passed: true,
  batteryHashes: beforeBattery,
  assertions: [
    "report-only registration preserves registry",
    "report-only registration is idempotent",
    "approved registration requires approval evidence",
    "pending-art exposes no runtime states",
    "Battery approval and bytes are unchanged"
  ]
}, null, 2) + "\n");

console.log("Character approval preservation v3 check passed.");
