import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const review = JSON.parse(await fs.readFile('data/character-review.json', 'utf8'));
const states = ['empty', 'low', 'calm', 'happy', 'excited'];
const stateLabels = {
  empty: 'EMPTY',
  low: 'LOW',
  calm: 'CALM',
  happy: 'HAPPY',
  excited: 'EXCITED'
};
const characters = review.characters || [];
const cellW = 360;
const cellH = 430;
const labelH = 82;
const nameW = 190;
const width = nameW + states.length * cellW;
const height = labelH + characters.length * cellH;
const out = path.join(root, 'qa/character-production-v3/READINESS/supplied-character-five-state-review.png');

function esc(value) {
  return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function checkerboard() {
  const tile = 24;
  const parts = [];
  for (let y = labelH; y < height; y += tile) {
    for (let x = nameW; x < width; x += tile) {
      const fill = ((x / tile + y / tile) % 2) ? '#eef4fb' : '#dce8f4';
      parts.push(`<rect x="${x}" y="${y}" width="${tile}" height="${tile}" fill="${fill}"/>`);
    }
  }
  return parts.join('');
}

const composites = [];
const svgParts = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
  '<rect width="100%" height="100%" fill="#f8fbff"/>',
  checkerboard(),
  `<text x="${nameW + (states.length * cellW) / 2}" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#12345c">Supplied Character Five-State Review</text>`,
  `<text x="${nameW + (states.length * cellW) / 2}" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#52617a">Review-only source poses. Not approved production runtime artwork.</text>`
];

states.forEach((state, index) => {
  const x = nameW + index * cellW + cellW / 2;
  svgParts.push(`<text x="${x}" y="${labelH + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#12345c">${stateLabels[state]}</text>`);
});

for (let row = 0; row < characters.length; row += 1) {
  const character = characters[row];
  const y = labelH + row * cellH;
  svgParts.push(`<rect x="0" y="${y}" width="${width}" height="${cellH}" fill="${row % 2 ? '#ffffff88' : '#f4f9ff88'}"/>`);
  svgParts.push(`<text x="${nameW - 20}" y="${y + cellH / 2 - 8}" text-anchor="end" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#12345c">${esc(character.name)}</text>`);
  svgParts.push(`<text x="${nameW - 20}" y="${y + cellH / 2 + 20}" text-anchor="end" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#52617a">${Object.keys(character.states || {}).length}/5 supplied</text>`);
  for (let col = 0; col < states.length; col += 1) {
    const state = states[col];
    const asset = character.states?.[state];
    const x = nameW + col * cellW;
    svgParts.push(`<rect x="${x + 12}" y="${y + 58}" width="${cellW - 24}" height="${cellH - 78}" rx="22" fill="#ffffff66" stroke="#c9d9ea"/>`);
    if (!asset?.src) {
      svgParts.push(`<text x="${x + cellW / 2}" y="${y + cellH / 2 + 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#6b7d92">NOT SUPPLIED</text>`);
      continue;
    }
    const input = path.join(root, asset.src);
    const image = await sharp(input).resize({
      width: cellW - 44,
      height: cellH - 102,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }).png().toBuffer();
    composites.push({
      input: image,
      left: x + 22,
      top: y + 70
    });
  }
}

svgParts.push('</svg>');
await fs.mkdir(path.dirname(out), { recursive: true });
await sharp(Buffer.from(svgParts.join(''))).composite(composites).png().toFile(out);
console.log(`Wrote ${path.relative(root, out)}`);
