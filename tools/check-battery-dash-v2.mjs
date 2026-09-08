import fs from "node:fs";
import vm from "node:vm";

const failures = [];

const engineSource = `${fs.readFileSync("v2-engine.js", "utf8")}\nglobalThis.__LeonSalV2 = LeonSalV2;`;
const sandbox = {
  window: {
    matchMedia: () => ({ matches: false, addEventListener() {} })
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  EventTarget,
  CustomEvent,
  performance,
  requestAnimationFrame: (callback) => setTimeout(() => callback(performance.now()), 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  setTimeout,
  clearTimeout,
  console,
  globalThis: {}
};
vm.createContext(sandbox);
vm.runInContext(engineSource, sandbox);

const { GaugeBattery, stateForEnergy } = sandbox.globalThis.__LeonSalV2;

const attrs = new Map();
const makeElement = (name) => ({
  name,
  textContent: "",
  setAttribute(key, value) {
    attrs.set(`${name}.${key}`, String(value));
  },
  getAttribute(key) {
    return attrs.get(`${name}.${key}`);
  }
});
const eyes = [makeElement("leftEye"), makeElement("rightEye")];
const face = makeElement("mouth");
const fill = makeElement("fill");
const label = makeElement("label");
const svg = {
  dataset: {},
  querySelector(selector) {
    if (selector === "[data-fill]") return fill;
    if (selector === "[data-face]") return face;
    if (selector === "[data-label]") return label;
    return null;
  },
  querySelectorAll(selector) {
    return selector === "[data-eye]" ? eyes : [];
  }
};

const gauge = new GaugeBattery(svg);
const bodyCenterX = 52 + 294 / 2;
const samples = [
  [0, "empty"],
  [25, "low"],
  [50, "calm"],
  [75, "happy"],
  [100, "excited"]
];

const seenMouths = new Set();
for (const [energy, expectedState] of samples) {
  const result = gauge.set(energy);
  if (result.state !== expectedState) {
    failures.push(`Battery ${energy}% expected ${expectedState}, got ${result.state}`);
  }
  const leftX = Number(eyes[0].getAttribute("cx"));
  const rightX = Number(eyes[1].getAttribute("cx"));
  const leftY = Number(eyes[0].getAttribute("cy"));
  const rightY = Number(eyes[1].getAttribute("cy"));
  const radius = Number(eyes[0].getAttribute("r"));
  if (Math.abs(((leftX + rightX) / 2) - bodyCenterX) > 0.01) {
    failures.push(`Battery ${energy}% eyes are not centered on the body interior`);
  }
  if (Math.abs((bodyCenterX - leftX) - (rightX - bodyCenterX)) > 0.01) {
    failures.push(`Battery ${energy}% eyes are not symmetrical`);
  }
  if (Math.abs(leftY - rightY) > 0.01) {
    failures.push(`Battery ${energy}% eyes are vertically misaligned`);
  }
  if (radius <= 0) failures.push(`Battery ${energy}% eye radius is invalid`);
  const mouth = face.getAttribute("d");
  if (!mouth?.includes(`Q${bodyCenterX}`)) {
    failures.push(`Battery ${energy}% mouth is not centered on the body interior`);
  }
  seenMouths.add(mouth);
}
if (seenMouths.size !== samples.length) {
  failures.push("Battery five states must have visually distinct mouth geometry");
}
if (stateForEnergy(36) !== "low" || stateForEnergy(50) !== "calm" || stateForEnergy(75) !== "happy") {
  failures.push("Canonical energy thresholds drifted");
}

const dashSource = fs.readFileSync("v2-dash-dock.html", "utf8");
const dashRequired = [
  "let dashPosition = 0;",
  "let energy = 0;",
  "if (!charged) energy = 0;",
  "if (dashPosition >= 95) charge();",
  "motion.tween({ from: 0, to: 100",
  "helper.dataset.active = 'true';",
  "dashPosition = 0;",
  "energy = 0;",
  "charging = false;",
  "charged = false;"
];
for (const snippet of dashRequired) {
  if (!dashSource.includes(snippet)) failures.push(`Dash invariant missing: ${snippet}`);
}

if (failures.length) {
  console.error("Battery/Dash V2 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Battery/Dash V2 check passed: face geometry is body-centered and Dash position/energy lifecycle invariants are present.");
