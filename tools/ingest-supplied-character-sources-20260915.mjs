import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const intakeDir = "assets/source-safe-keeping/supplied-20260915";
const qaDir = "qa/character-production-v3/SUPPLIED-20260915";

const sources = [
  ["elephant", "empty", "/Users/mehdisalarzadeh/Downloads/A00E6AD9-596D-4B8A-B9EF-B5AC3D47E1B8.PNG"],
  ["elephant", "excited", "/Users/mehdisalarzadeh/Downloads/0648F45D-E521-4C90-A416-2B01D720705A.PNG"],
  ["elephant", "happy", "/Users/mehdisalarzadeh/Downloads/B33C86D2-F662-4BDD-A411-41A398A7818C.PNG"],
  ["elephant", "low", "/Users/mehdisalarzadeh/Downloads/141DD311-CAFD-47A2-B608-D9845A7099A0.PNG"],
  ["zaya", "excited", "/Users/mehdisalarzadeh/Downloads/389AD1D0-D797-4A72-9F97-0183A96FEC4E.PNG"],
  ["zaya", "calm", "/Users/mehdisalarzadeh/Downloads/12F23ED9-AD0C-49A2-BA57-264362F1D79B.PNG"],
  ["zaya", "low", "/Users/mehdisalarzadeh/Downloads/48CB2E37-1B58-458C-9A71-F469406BE246.PNG"],
  ["zaya", "happy", "/Users/mehdisalarzadeh/Downloads/FE6E929C-D223-4081-B814-F204EB43D7B0.PNG"],
  ["zaya", "empty", "/Users/mehdisalarzadeh/Downloads/94DFB183-CEE1-4D30-B415-16DF2D460771.PNG"],
  ["leon", "excited", "/Users/mehdisalarzadeh/Downloads/6FD3E169-1B1A-4873-AD01-BD9958D5E933.PNG"],
  ["leon", "calm", "/Users/mehdisalarzadeh/Downloads/655C4720-865F-44B6-9D62-4B132CAA5A2F.PNG"],
  ["leon", "neutral", "/Users/mehdisalarzadeh/Downloads/43329A8D-9B15-4442-B997-8101A9038A6A.PNG"],
  ["leon", "low", "/Users/mehdisalarzadeh/Downloads/B99C7F20-BC7A-4C39-A211-7736ED517606.PNG"],
  ["leon", "happy", "/Users/mehdisalarzadeh/Downloads/3E906E87-927E-442A-B240-A3632FE98B48.PNG"],
  ["lion", "reference-sheet", "/Users/mehdisalarzadeh/Downloads/69F27C2E-E4FE-43F6-B910-DB32D32BE9DE.PNG"]
];

const excluded = [
  {
    path: "/Users/mehdisalarzadeh/Downloads/IMG_7371.jpg",
    reason: "excluded-sensitive-non-character-screenshot"
  }
];

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function checkerboard(width, height, size = 32) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#edf4fb"/>`
  ];
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      if (((x / size) + (y / size)) % 2 === 0) {
        svg.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#d8e7f5"/>`);
      }
    }
  }
  svg.push("</svg>");
  return Buffer.from(svg.join(""));
}

function titleFor(token) {
  return token.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join(" ");
}

await fs.mkdir(path.join(root, intakeDir), { recursive: true });
await fs.mkdir(path.join(root, qaDir), { recursive: true });

const entries = [];
for (const [character, state, absoluteSource] of sources) {
  const buffer = await fs.readFile(absoluteSource);
  const metadata = await sharp(buffer).metadata();
  const characterDir = path.join(root, intakeDir, character);
  await fs.mkdir(characterDir, { recursive: true });
  const destination = path.join(intakeDir, character, `${state}.png`);
  await fs.writeFile(path.join(root, destination), buffer);
  const { data: stats } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let transparentPixels = 0;
  for (let index = 3; index < stats.length; index += 4) {
    if (stats[index] === 0) transparentPixels += 1;
  }
  entries.push({
    character,
    state,
    status: "review-only",
    productionApproved: false,
    sourcePath: destination,
    originalFilename: path.basename(absoluteSource),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    hasAlpha: Boolean(metadata.hasAlpha),
    transparentPixels,
    sha256: sha256(buffer),
    notes: state === "reference-sheet"
      ? "Multi-pose reference only; not an individual runtime asset."
      : "Supplied transparent character reference. Must pass identity, state, source, and production visual QA before any approval."
  });
}

const manifest = {
  version: 1,
  created: new Date().toISOString(),
  status: "review-only",
  productionApproved: false,
  decision: "Character artwork references are preserved for production rebuild/QA only. No runtime approval changes are made by this intake.",
  excluded,
  entries
};

await fs.writeFile(path.join(root, qaDir, "supplied-character-source-intake.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const cellWidth = 270;
const cellHeight = 330;
const labelHeight = 54;
const columns = 5;
const rows = Math.ceil(entries.length / columns);
const sheetWidth = columns * cellWidth;
const sheetHeight = rows * cellHeight;
const composites = [{ input: checkerboard(sheetWidth, sheetHeight), left: 0, top: 0 }];

for (const [index, entry] of entries.entries()) {
  const left = (index % columns) * cellWidth;
  const top = Math.floor(index / columns) * cellHeight;
  const image = await sharp(path.join(root, entry.sourcePath))
    .resize({ width: 210, height: 235, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const meta = await sharp(image).metadata();
  composites.push({
    input: image,
    left: left + Math.round((cellWidth - (meta.width || 0)) / 2),
    top: top + 16
  });
  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="${labelHeight}" viewBox="0 0 ${cellWidth} ${labelHeight}">
      <rect x="14" y="5" width="${cellWidth - 28}" height="44" rx="18" fill="rgba(255,255,255,.88)"/>
      <text x="${cellWidth / 2}" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#173356">${titleFor(entry.character)}</text>
      <text x="${cellWidth / 2}" y="43" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#60748d">${titleFor(entry.state)} · review only</text>
    </svg>`
  );
  composites.push({ input: label, left, top: top + cellHeight - labelHeight - 8 });
}

await sharp({
  create: {
    width: sheetWidth,
    height: sheetHeight,
    channels: 4,
    background: "#ffffff"
  }
})
  .composite(composites)
  .png()
  .toFile(path.join(root, qaDir, "supplied-character-source-contact-sheet.png"));

console.log(`Ingested ${entries.length} supplied character references as review-only.`);
