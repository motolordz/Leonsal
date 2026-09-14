import assert from "node:assert/strict";
import fs from "node:fs/promises";

const queuePath = "qa/character-production-v3/PRODUCTION-QUEUE/character-production-queue.json";
const mdPath = "qa/character-production-v3/PRODUCTION-QUEUE/CHARACTER-PRODUCTION-QUEUE.md";
const queue = JSON.parse(await fs.readFile(queuePath, "utf8"));
const markdown = await fs.readFile(mdPath, "utf8");
const states = ["empty", "low", "calm", "happy", "excited"];

assert.equal(queue.schemaVersion, 1, "Unexpected production queue schema version");
assert.equal(queue.approvedRuntimeStateAssets, 5, "Battery Buddy should remain the only approved runtime five-state set");
assert.equal(queue.pendingCharacters, 68, "Expected 68 pending production characters");
assert.equal(queue.pendingStateAssets, 340, "Expected 340 pending production state assets");
assert.equal(queue.priorities.P0, 2, "Leon and Zaya must remain the P0 guide queue");
assert.equal(queue.families.alphabet, 26, "Alphabet queue must cover A-Z");
assert.equal(queue.families.number, 10, "Number queue must cover 1-10");
assert.equal(queue.families.planet, 10, "Planet queue must cover the canonical planet set");
assert(!queue.queue.some((item) => item.status === "approved"), "Queue must not contain approved entries");

for (const item of queue.queue) {
  assert.equal(item.status, "pending-production", `${item.id} must remain pending-production`);
  assert(item.nextAction, `${item.id} missing next action`);
  assert(item.allowedSourceUse.includes("Reference only"), `${item.id} must keep supplied art as reference-only`);
  assert(item.allowedSourceUse.includes("must not be runtime sources"), `${item.id} must preserve runtime source boundary`);
  assert.deepEqual(Object.keys(item.stateSlots), states, `${item.id} must enumerate all five state slots`);
  assert.equal(item.requiredOutputs.length, 10, `${item.id} must require five masters and five web derivatives`);
  assert(item.requiredOutputs.every((output) => !/source-safe-keeping|character-review|qa\/|contact-sheet|rejected/i.test(output)), `${item.id} has blocked required output path`);
  assert(item.requiredEvidence.some((evidence) => evidence.endsWith("visual-acceptance.json")), `${item.id} missing visual acceptance evidence`);
}

assert(queue.queue.find((item) => item.id === "leon")?.nextAction.includes("EMPTY"), "Leon queue must preserve empty-state blocker");
assert(queue.queue.find((item) => item.id === "zaya")?.nextAction.includes("2048px"), "Zaya queue must preserve production-size rebuild need");
assert(markdown.includes("This queue turns the character mission into reviewable production work"), "Markdown queue missing purpose");
assert(markdown.includes("Pending entries may use supplied artwork as visual reference only"), "Markdown queue missing reference-only rule");
assert(markdown.includes("Runtime image paths must stay empty until approval"), "Markdown queue missing runtime boundary");

console.log("Character production queue checks passed.");
