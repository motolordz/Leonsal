import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outDir = path.join(root, "qa/character-production-v3/LEON-ZAYA-METHOD-PILOT");
const candidates = [
  {
    id: "leon",
    file: "assets/characters-v2/_staging/leon-zaya-method-pilot/leon-calm-candidate-v1.png",
    reference: "assets/source-safe-keeping/approved-character-sheets-v2/leon-five-state-large.jpg",
    promptResult: "Generated candidate is style-useful but failed production transparency because a dark backdrop/glow is present."
  },
  {
    id: "zaya",
    file: "assets/characters-v2/_staging/leon-zaya-method-pilot/zaya-calm-candidate-v1.png",
    reference: "assets/source-safe-keeping/approved-character-sheets-v2/zaya-five-state-large.jpg",
    promptResult: "Generated candidate is style-useful but failed production transparency because the checkerboard is baked into the pixels."
  }
];

async function inspect(candidate) {
  const full = path.join(root, candidate.file);
  const meta = await sharp(full).metadata();
  const raw = await sharp(full).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const cornerIndexes = [
    3,
    ((info.width - 1) * info.channels) + 3,
    (((info.height - 1) * info.width) * info.channels) + 3,
    (((info.width * info.height) - 1) * info.channels) + 3
  ];
  const transparentCorners = cornerIndexes.every((index) => data[index] < 8);
  let transparentPixels = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] < 8) transparentPixels += 1;
  }
  return {
    ...candidate,
    width: meta.width,
    height: meta.height,
    format: meta.format,
    hasAlpha: Boolean(meta.hasAlpha),
    transparentPixelRatio: transparentPixels / (info.width * info.height),
    transparentCorners,
    productionStatus: "review-only-method-proof",
    approved: false
  };
}

function checkerboard(width, height) {
  const size = 32;
  let rects = "";
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      rects += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${((x / size) + (y / size)) % 2 ? "#d9e2ef" : "#f7fbff"}"/>`;
    }
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${rects}</svg>`);
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const inspected = [];
  const composites = [];
  const cellW = 720;
  const cellH = 960;
  const labelH = 96;
  for (const [index, candidate] of candidates.entries()) {
    const result = await inspect(candidate);
    inspected.push(result);
    const image = await sharp(path.join(root, candidate.file))
      .resize({ width: cellW - 80, height: cellH - labelH - 80, fit: "contain", withoutEnlargement: true })
      .png()
      .toBuffer();
    composites.push({ input: image, left: index * cellW + 40, top: labelH + 40 });
    const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${labelH}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="50%" y="40" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#10234a">${candidate.id.toUpperCase()} METHOD CANDIDATE</text>
      <text x="50%" y="72" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#b42318">REVIEW ONLY - NOT APPROVED PRODUCTION ART</text>
    </svg>`);
    composites.push({ input: label, left: index * cellW, top: 0 });
  }
  const contactSheet = path.join(outDir, "leon-zaya-method-candidates.png");
  await sharp(checkerboard(cellW * candidates.length, cellH))
    .composite(composites)
    .png()
    .toFile(contactSheet);
  await fs.writeFile(path.join(outDir, "method-pilot-summary.json"), JSON.stringify({
    creativeToolAvailable: true,
    productionApproval: "none",
    newApprovedCharacters: 0,
    reviewOnlyCharacters: inspected.map((item) => item.id),
    candidates: inspected
  }, null, 2) + "\n");
  console.log(`Leon/Zaya method pilot QA written to ${path.relative(root, contactSheet)}`);
}

await main();
