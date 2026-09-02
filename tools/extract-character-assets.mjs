import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const states = ["empty", "low", "calm", "happy", "excited"];
const root = process.cwd();
const sourceRoot = path.join(root, "assets/source-safe-keeping/approved-character-sheets");
const assetRoot = path.join(root, "assets/characters");
const dataRoot = path.join(root, "data");

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

async function crop(sourceFile, outFile, box) {
  ensureDir(path.dirname(outFile));
  await sharp(path.join(sourceRoot, sourceFile))
    .extract(box)
    .resize({ height: 520, withoutEnlargement: false })
    .webp({ quality: 92 })
    .toFile(outFile);
}

function assetPath(parts, state) {
  return path.join(assetRoot, ...parts, `${state}.webp`);
}

function webPath(parts, state) {
  return `assets/characters/${parts.join("/")}/${state}.webp`;
}

async function extractSheetGrid({ sourceFile, familyParts, rows, xByState, cropWidth, cropHeight, yOffset = 0 }) {
  const records = [];
  for (let row = 0; row < rows.length; row += 1) {
    const item = rows[row];
    const parts = [...familyParts, item.slug];
    const stateMap = {};
    for (let stateIndex = 0; stateIndex < states.length; stateIndex += 1) {
      const state = states[stateIndex];
      const left = xByState[stateIndex];
      const top = item.y + yOffset;
      await crop(sourceFile, assetPath(parts, state), {
        left,
        top,
        width: cropWidth[stateIndex] || cropWidth[0],
        height: cropHeight
      });
      stateMap[state] = webPath(parts, state);
    }
    records.push({ ...item, states: stateMap });
  }
  return records;
}

async function main() {
  ensureDir(assetRoot);
  ensureDir(dataRoot);

  const registry = {
    states,
    guides: [],
    alphabet: [],
    numbers: [],
    world: [],
    missing: []
  };

  for (const guide of [
    { slug: "leon", displayName: "Leon", sourceFile: "leon-five-state-large.jpg", y: 160 },
    { slug: "zaya", displayName: "Zaya", sourceFile: "zaya-five-state-large.jpg", y: 170 }
  ]) {
    const x = [25, 275, 520, 770, 1015];
    const widths = [245, 230, 225, 235, 240];
    const stateMap = {};
    for (let i = 0; i < states.length; i += 1) {
      await crop(guide.sourceFile, assetPath([guide.slug], states[i]), {
        left: x[i],
        top: guide.y,
        width: widths[i],
        height: 470
      });
      stateMap[states[i]] = webPath([guide.slug], states[i]);
    }
    registry.guides.push({
      id: guide.slug,
      displayName: guide.displayName,
      family: "guide",
      states: stateMap
    });
  }

  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const letterRows = [
    { state: "empty", y: 360 },
    { state: "low", y: 450 },
    { state: "calm", y: 540 },
    { state: "happy", y: 630 },
    { state: "excited", y: 720 }
  ];
  for (let index = 0; index < letters.length; index += 1) {
    const letter = letters[index];
    const statesMap = {};
    const left = 105 + index * 44;
    for (const row of letterRows) {
      await crop("alphabet-and-guides-five-state.jpg", assetPath(["alphabet", letter], row.state), {
        left,
        top: row.y,
        width: 44,
        height: 76
      });
      statesMap[row.state] = webPath(["alphabet", letter], row.state);
    }
    registry.alphabet.push({
      id: `letter-${letter}`,
      displayName: `Letter ${letter.toUpperCase()}`,
      uppercase: letter.toUpperCase(),
      lowercase: letter,
      family: "alphabet",
      states: statesMap
    });
  }

  const numberX = [140, 365, 590, 815, 1038];
  const numberRows = Array.from({ length: 10 }, (_, index) => ({
    slug: String(index + 1),
    value: index + 1,
    y: 49 + index * 80
  }));
  for (const item of numberRows) {
    const statesMap = {};
    for (let i = 0; i < states.length; i += 1) {
      await crop("numbers-five-state.jpg", assetPath(["numbers", item.slug], states[i]), {
        left: numberX[i],
        top: item.y,
        width: i === 4 ? 220 : 205,
        height: 74
      });
      statesMap[states[i]] = webPath(["numbers", item.slug], states[i]);
    }
    registry.numbers.push({
      id: `number-${item.value}`,
      displayName: `Number ${item.value}`,
      value: item.value,
      family: "number",
      states: statesMap
    });
  }

  const worldX = [105, 305, 505, 705, 880];
  const worldWidth = [180, 170, 170, 170, 138];
  const worldSheets = [
    {
      sourceFile: "world-core-battery-elephant-bus-plane-boat-letter-a.jpg",
      rows: [
        { slug: "battery-buddy", displayName: "Battery Buddy", y: 105 },
        { slug: "elephant", displayName: "Elephant", y: 300 },
        { slug: "double-decker", displayName: "Double-decker Bus", y: 500 },
        { slug: "plane", displayName: "Plane", y: 690 },
        { slug: "boat", displayName: "Boat", y: 890 },
        { slug: "letter-a", displayName: "Letter A", y: 1080 }
      ],
      height: 150
    },
    {
      sourceFile: "world-cupcake-soccer-pencil-house-tree.jpg",
      rows: [
        { slug: "cupcake", displayName: "Cupcake", y: 145 },
        { slug: "soccer-ball", displayName: "Soccer Ball", y: 375 },
        { slug: "pencil", displayName: "Pencil", y: 610 },
        { slug: "house", displayName: "House", y: 840 },
        { slug: "tree", displayName: "Tree", y: 1070 }
      ],
      height: 170
    },
    {
      sourceFile: "world-train-car-helicopter-robot-apple.jpg",
      rows: [
        { slug: "train", displayName: "Train", y: 145 },
        { slug: "car", displayName: "Car", y: 375 },
        { slug: "helicopter", displayName: "Helicopter", y: 610 },
        { slug: "robot", displayName: "Robot", y: 840 },
        { slug: "apple", displayName: "Apple", y: 1070 }
      ],
      height: 170
    },
    {
      sourceFile: "world-lion-monkey-turtle-clownfish-rocket.jpg",
      rows: [
        { slug: "lion", displayName: "Lion", y: 145 },
        { slug: "monkey", displayName: "Monkey", y: 375 },
        { slug: "turtle", displayName: "Turtle", y: 610 },
        { slug: "clownfish", displayName: "Clownfish", y: 840 },
        { slug: "rocket", displayName: "Rocket", y: 1070 }
      ],
      height: 170
    },
    {
      sourceFile: "world-star-sun-cloud-rainbow-dinosaur.jpg",
      rows: [
        { slug: "star", displayName: "Star", y: 145 },
        { slug: "sun", displayName: "Sun", y: 375 },
        { slug: "cloud", displayName: "Cloud", y: 610 },
        { slug: "rainbow", displayName: "Rainbow", y: 840 },
        { slug: "dinosaur", displayName: "Dinosaur", y: 1070 }
      ],
      height: 170
    }
  ];

  for (const sheet of worldSheets) {
    for (const item of sheet.rows) {
      const statesMap = {};
      for (let i = 0; i < states.length; i += 1) {
        await crop(sheet.sourceFile, assetPath(["world", item.slug], states[i]), {
          left: worldX[i],
          top: item.y,
          width: worldWidth[i],
          height: sheet.height
        });
        statesMap[states[i]] = webPath(["world", item.slug], states[i]);
      }
      registry.world.push({
        id: item.slug,
        displayName: item.displayName,
        family: "world",
        states: statesMap
      });
    }
  }

  fs.writeFileSync(path.join(dataRoot, "character-assets.json"), `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`Created ${states.length * (registry.guides.length + registry.alphabet.length + registry.numbers.length + registry.world.length)} character-state assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
