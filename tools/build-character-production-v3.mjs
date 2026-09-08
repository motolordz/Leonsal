import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const states = ["empty", "low", "calm", "happy", "excited"];
const stateSpec = {
  empty: { pct: 0, mood: "sleepy", fill: "#ef6470", pose: -6, eye: "closed", mouth: "sleep", accent: "#ef6470" },
  low: { pct: 25, mood: "low", fill: "#ff8f37", pose: -2, eye: "tired", mouth: "small", accent: "#ff8f37" },
  calm: { pct: 50, mood: "calm", fill: "#ffd33f", pose: 0, eye: "open", mouth: "calm", accent: "#ffd33f" },
  happy: { pct: 75, mood: "happy", fill: "#58db5b", pose: 4, eye: "open", mouth: "happy", accent: "#58db5b" },
  excited: { pct: 100, mood: "excited", fill: "#1fc9f5", pose: 8, eye: "wide", mouth: "open", accent: "#1fc9f5" }
};

const alphabet = JSON.parse(await fs.readFile(path.join(root, "data/alphabet.json"), "utf8"));
const numbers = JSON.parse(await fs.readFile(path.join(root, "data/numbers.json"), "utf8"));
const world = JSON.parse(await fs.readFile(path.join(root, "data/world-characters.json"), "utf8"));
const planets = JSON.parse(await fs.readFile(path.join(root, "data/planets.json"), "utf8"));

const guides = [
  { id: "leon", displayName: "Leon", nameText: "LEON", color: "#2685e8", hair: "#2b1b13", skin: "#f5b17e", family: "guides", root: "assets/characters-v2/leon", sourceReference: "data/characters.json#guide-leon" },
  { id: "zaya", displayName: "Zaya", nameText: "ZAYA", color: "#f15aa4", hair: "#4b2a1b", skin: "#d99166", family: "guides", root: "assets/characters-v2/zaya", sourceReference: "data/characters.json#guide-zaya" }
];

const palette = ["#2f95df", "#52b357", "#f28b30", "#7d66d9", "#df5d99", "#1994a1", "#f6c33d", "#ef5954"];
const planetStyles = {
  sun: ["#ffcf4a", "#ff8c28"], mercury: ["#b9ada3", "#7d736e"], venus: ["#f6c37a", "#cf864e"], earth: ["#2f95df", "#56bf6b"],
  mars: ["#e05a3a", "#9f3224"], jupiter: ["#d8a66c", "#8e5d35"], saturn: ["#e6c878", "#b28f4f"], uranus: ["#91e3e4", "#4fbbc1"],
  neptune: ["#3769d9", "#223e96"], moon: ["#d7dce7", "#8c96a8"]
};

function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function face(cx, cy, scale, state, options = {}) {
  const spec = stateSpec[state];
  const eyeGap = 95 * scale;
  const eyeY = cy - 22 * scale;
  const cheekY = cy + 46 * scale;
  const cheek = `<ellipse cx="${cx - 145 * scale}" cy="${cheekY}" rx="${40 * scale}" ry="${26 * scale}" fill="#ff9aa5" opacity=".7"/>
    <ellipse cx="${cx + 145 * scale}" cy="${cheekY}" rx="${40 * scale}" ry="${26 * scale}" fill="#ff9aa5" opacity=".7"/>`;
  let eyes;
  if (spec.eye === "closed") {
    eyes = `<path d="M${cx - eyeGap - 44 * scale} ${eyeY} C${cx - eyeGap - 10 * scale} ${eyeY + 34 * scale} ${cx - eyeGap + 44 * scale} ${eyeY + 34 * scale} ${cx - eyeGap + 78 * scale} ${eyeY}" fill="none" stroke="#102746" stroke-width="${22 * scale}" stroke-linecap="round"/>
      <path d="M${cx + eyeGap - 78 * scale} ${eyeY} C${cx + eyeGap - 44 * scale} ${eyeY + 34 * scale} ${cx + eyeGap + 10 * scale} ${eyeY + 34 * scale} ${cx + eyeGap + 44 * scale} ${eyeY}" fill="none" stroke="#102746" stroke-width="${22 * scale}" stroke-linecap="round"/>`;
  } else {
    const ry = spec.eye === "tired" ? 44 : spec.eye === "wide" ? 64 : 56;
    const lid = spec.eye === "tired" ? `<path d="M${cx - eyeGap - 52 * scale} ${eyeY - 32 * scale} C${cx - eyeGap} ${eyeY - 70 * scale} ${cx - eyeGap + 56 * scale} ${eyeY - 38 * scale}" fill="none" stroke="#102746" stroke-width="${18 * scale}" stroke-linecap="round"/>
      <path d="M${cx + eyeGap - 56 * scale} ${eyeY - 38 * scale} C${cx + eyeGap} ${eyeY - 70 * scale} ${cx + eyeGap + 52 * scale} ${eyeY - 32 * scale}" fill="none" stroke="#102746" stroke-width="${18 * scale}" stroke-linecap="round"/>` : "";
    eyes = `${lid}<ellipse cx="${cx - eyeGap}" cy="${eyeY}" rx="${42 * scale}" ry="${ry * scale}" fill="#102746"/>
      <ellipse cx="${cx + eyeGap}" cy="${eyeY}" rx="${42 * scale}" ry="${ry * scale}" fill="#102746"/>
      <ellipse cx="${cx - eyeGap + 14 * scale}" cy="${eyeY - 18 * scale}" rx="${13 * scale}" ry="${18 * scale}" fill="#fff"/>
      <ellipse cx="${cx + eyeGap + 14 * scale}" cy="${eyeY - 18 * scale}" rx="${13 * scale}" ry="${18 * scale}" fill="#fff"/>`;
  }
  const mouthY = cy + 122 * scale;
  const mouths = {
    sleep: `<path d="M${cx - 30 * scale} ${mouthY} Q${cx} ${mouthY - 28 * scale} ${cx + 30 * scale} ${mouthY}" fill="none" stroke="#102746" stroke-width="${18 * scale}" stroke-linecap="round"/>`,
    small: `<path d="M${cx - 52 * scale} ${mouthY} Q${cx} ${mouthY + 44 * scale} ${cx + 52 * scale} ${mouthY}" fill="none" stroke="#102746" stroke-width="${18 * scale}" stroke-linecap="round"/>`,
    calm: `<path d="M${cx - 70 * scale} ${mouthY} Q${cx} ${mouthY + 58 * scale} ${cx + 70 * scale} ${mouthY}" fill="none" stroke="#102746" stroke-width="${20 * scale}" stroke-linecap="round"/>`,
    happy: `<path d="M${cx - 92 * scale} ${mouthY - 8 * scale} Q${cx} ${mouthY + 88 * scale} ${cx + 92 * scale} ${mouthY - 8 * scale}" fill="none" stroke="#102746" stroke-width="${23 * scale}" stroke-linecap="round"/>`,
    open: `<path d="M${cx - 95 * scale} ${mouthY - 22 * scale} Q${cx} ${mouthY + 140 * scale} ${cx + 95 * scale} ${mouthY - 22 * scale} Q${cx} ${mouthY + 48 * scale} ${cx - 95 * scale} ${mouthY - 22 * scale}Z" fill="#102746"/>
      <path d="M${cx - 45 * scale} ${mouthY + 74 * scale} Q${cx} ${mouthY + 112 * scale} ${cx + 45 * scale} ${mouthY + 74 * scale}" fill="none" stroke="#ff747b" stroke-width="${18 * scale}" stroke-linecap="round"/>`
  };
  const accents = state === "excited" && !options.noAccents ? `<g stroke="${spec.accent}" stroke-width="${18 * scale}" stroke-linecap="round" opacity=".8">
    <path d="M${cx - 260 * scale} ${cy - 210 * scale} l-${70 * scale} -${45 * scale}"/><path d="M${cx + 260 * scale} ${cy - 210 * scale} l${70 * scale} -${45 * scale}"/>
    <path d="M${cx - 290 * scale} ${cy + 30 * scale} l-${90 * scale} 0"/><path d="M${cx + 290 * scale} ${cy + 30 * scale} l${90 * scale} 0"/></g>` : "";
  return `${accents}${eyes}${cheek}${mouths[spec.mouth]}`;
}

function stateBackdrop(state, accent = "#58db5b") {
  if (!state) return "";
  if (state === "empty") {
    return `<g opacity=".82">
      <ellipse cx="1024" cy="1508" rx="360" ry="84" fill="#cfe1ff"/>
      <path d="M1338 540 C1258 570 1216 666 1252 748 C1178 706 1138 612 1174 526 C1210 438 1300 394 1388 420 C1348 448 1328 492 1338 540Z" fill="#9fc2ff"/>
    </g>`;
  }
  if (state === "low") {
    return `<g opacity=".8">
      <path d="M1428 640 C1490 725 1446 810 1378 828 C1412 758 1392 704 1340 654Z" fill="#7bb7ff"/>
      <ellipse cx="1024" cy="1518" rx="330" ry="70" fill="#ffd9bd"/>
    </g>`;
  }
  if (state === "calm") {
    return `<g opacity=".72">
      <circle cx="648" cy="690" r="34" fill="${accent}"/>
      <circle cx="1400" cy="690" r="34" fill="${accent}"/>
      <ellipse cx="1024" cy="1518" rx="340" ry="72" fill="#fff1ad"/>
    </g>`;
  }
  if (state === "happy") {
    return `<g opacity=".82" stroke="${accent}" stroke-width="38" stroke-linecap="round" fill="none">
      <path d="M520 846 C430 1000 450 1170 560 1304"/>
      <path d="M1528 846 C1618 1000 1598 1170 1488 1304"/>
      <ellipse cx="1024" cy="1518" rx="360" ry="76" fill="#c8ffd0" stroke="none"/>
    </g>`;
  }
  return `<g opacity=".86" stroke="${accent}" stroke-width="42" stroke-linecap="round" fill="#ffd94e">
    <path d="M470 610 L390 530"/><path d="M1578 610 L1658 530"/>
    <path d="M390 990 H270"/><path d="M1658 990 H1778"/>
    <path d="M560 1370 L470 1460"/><path d="M1488 1370 L1578 1460"/>
    <circle cx="566" cy="430" r="28"/><circle cx="1482" cy="430" r="28"/>
  </g>`;
}

function shell(content, glow = "#dff5ff", state = null, accent = glow) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="32" stdDeviation="32" flood-color="#102746" flood-opacity=".24"/></filter>
    <linearGradient id="toy" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".38" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#102746" stop-opacity=".12"/></linearGradient>
  </defs>
  <ellipse cx="1024" cy="1692" rx="420" ry="72" fill="#102746" opacity=".10"/>
  <ellipse cx="1024" cy="980" rx="610" ry="640" fill="${glow}" opacity=".34"/>
  ${stateBackdrop(state, accent)}
  ${content}
  </svg>`;
}

function limbs(cx, baseY, scale, color, state) {
  const pose = stateSpec[state].pose;
  const armUp = state === "happy" || state === "excited";
  const sleep = state === "empty";
  return `<g stroke="#102746" stroke-width="${28 * scale}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M${cx - 230 * scale} ${baseY - 260 * scale} C${cx - 370 * scale} ${baseY - (armUp ? 430 : 190) * scale} ${cx - 420 * scale} ${baseY - (armUp ? 510 : 80) * scale} ${cx - 480 * scale} ${baseY - (armUp ? 500 : 40) * scale}" fill="none"/>
    <path d="M${cx + 230 * scale} ${baseY - 260 * scale} C${cx + 370 * scale} ${baseY - (armUp ? 430 : 190) * scale} ${cx + 420 * scale} ${baseY - (armUp ? 510 : 80) * scale} ${cx + 480 * scale} ${baseY - (armUp ? 500 : 40) * scale}" fill="none"/>
    <path d="M${cx - 138 * scale} ${baseY + 20 * scale} L${cx - (sleep ? 250 : 205) * scale} ${baseY + (210 - pose * 2) * scale}" fill="none"/>
    <path d="M${cx + 138 * scale} ${baseY + 20 * scale} L${cx + (sleep ? 250 : 205) * scale} ${baseY + (210 + pose * 2) * scale}" fill="none"/>
  </g>
  <g fill="#fff" stroke="#102746" stroke-width="${18 * scale}">
    <circle cx="${cx - 490 * scale}" cy="${baseY - (armUp ? 500 : 40) * scale}" r="${46 * scale}"/>
    <circle cx="${cx + 490 * scale}" cy="${baseY - (armUp ? 500 : 40) * scale}" r="${46 * scale}"/>
    <ellipse cx="${cx - (sleep ? 250 : 205) * scale}" cy="${baseY + (224 - pose * 2) * scale}" rx="${82 * scale}" ry="${42 * scale}"/>
    <ellipse cx="${cx + (sleep ? 250 : 205) * scale}" cy="${baseY + (224 + pose * 2) * scale}" rx="${82 * scale}" ry="${42 * scale}"/>
  </g>`;
}

function guideSvg(character, state) {
  const spec = stateSpec[state];
  const tilt = spec.pose * 0.45;
  const sleepy = state === "empty";
  const bodyY = sleepy ? 1110 : 1090;
  const headY = sleepy ? 690 : 610;
  const content = `<g filter="url(#shadow)" transform="rotate(${tilt} 1024 1010)">
    ${limbs(1024, 1320, 1.05, character.color, state)}
    <rect x="690" y="${bodyY}" width="668" height="510" rx="170" fill="${character.color}" stroke="#102746" stroke-width="34"/>
    <text x="1024" y="${bodyY + 300}" text-anchor="middle" font-family="Arial, sans-serif" font-size="126" font-weight="900" fill="#fff" stroke="#102746" stroke-width="8">${character.nameText}</text>
    <ellipse cx="1024" cy="${headY}" rx="315" ry="335" fill="${character.skin}" stroke="#102746" stroke-width="34"/>
    <path d="M724 ${headY - 172} C820 ${headY - 400} 1216 ${headY - 410} 1324 ${headY - 138} C1170 ${headY - 235} 950 ${headY - 210} 724 ${headY - 172}Z" fill="${character.hair}" stroke="#102746" stroke-width="24"/>
    ${face(1024, headY + 52, 1.05, state)}
    ${sleepy ? `<path d="M1370 520 q58 -48 116 0 q-58 48 -116 0Z" fill="#75a9ff" opacity=".85"/><text x="1430" y="442" font-family="Arial" font-size="90" font-weight="900" fill="#2f69d9">z</text>` : ""}
  </g>`;
  return shell(content, character.color, state, spec.accent);
}

function glyphSvg(record, state, type) {
  const spec = stateSpec[state];
  const char = type === "alphabet" ? record.uppercase : String(record.value);
  const idx = type === "alphabet" ? record.uppercase.charCodeAt(0) - 65 : Number(record.value) - 1;
  const color = palette[idx % palette.length];
  const fontSize = char.length > 1 ? 760 : type === "number" ? 930 : 900;
  const y = type === "number" ? 1198 : 1208;
  const arm = state === "happy" || state === "excited";
  const content = `<g filter="url(#shadow)">
    <text x="1024" y="${y}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${color}" stroke="#102746" stroke-width="32" paint-order="stroke">${esc(char)}</text>
    <text x="1024" y="${y}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="url(#toy)" opacity=".48">${esc(char)}</text>
    <g stroke="#102746" stroke-width="30" stroke-linecap="round">
      <path d="M650 1160 C${arm ? 510 : 570} ${arm ? 860 : 1220} 500 ${arm ? 750 : 1320} 440 ${arm ? 800 : 1325}" fill="none"/>
      <path d="M1398 1160 C${arm ? 1538 : 1478} ${arm ? 860 : 1220} 1548 ${arm ? 750 : 1320} 1608 ${arm ? 800 : 1325}" fill="none"/>
    </g>
    <g fill="#fff" stroke="#102746" stroke-width="20">
      <circle cx="440" cy="${arm ? 800 : 1325}" r="50"/><circle cx="1608" cy="${arm ? 800 : 1325}" r="50"/>
      <ellipse cx="830" cy="1512" rx="92" ry="48"/><ellipse cx="1218" cy="1512" rx="92" ry="48"/>
    </g>
    ${face(1024, 838, 1, state)}
    ${state === "empty" ? `<text x="1340" y="488" font-family="Arial" font-size="92" font-weight="900" fill="#2f69d9">z</text><text x="1430" y="400" font-family="Arial" font-size="62" font-weight="900" fill="#2f69d9">z</text>` : ""}
  </g>`;
  return shell(content, color, state, spec.accent);
}

function worldSvg(record, state) {
  const id = record.id.replace(/^world-/, "");
  const spec = stateSpec[state];
  const color = worldColor(id);
  const content = worldShape(id, color, state, spec);
  const transform = {
    empty: "translate(0 42) rotate(-5 1024 1024) scale(.96)",
    low: "translate(0 22) rotate(-2 1024 1024) scale(.98)",
    calm: "translate(0 0) scale(1)",
    happy: "translate(0 -26) rotate(2 1024 1024) scale(1.02)",
    excited: "translate(0 -48) rotate(4 1024 1024) scale(1.04)"
  }[state];
  return shell(`<g filter="url(#shadow)" transform="${transform}">${content}</g>`, color, state, spec.accent);
}

function worldColor(id) {
  const colors = {
    sun: "#ffca35", moon: "#d7dce7", cloud: "#d9ecff", rainbow: "#f15aa4", rocket: "#ef5954", earth: "#2f95df",
    robot: "#6fb6ff", magnifier: "#7d66d9", pencil: "#ffd33f", book: "#52b357", paintbrush: "#f28b30", "music-note": "#7d66d9",
    clock: "#91e3e4", calendar: "#ff8f37", puzzle: "#58db5b", water: "#35c5f4", tree: "#58b957", train: "#2f95df",
    dinosaur: "#52b357", treasure: "#c9893f"
  };
  return colors[id] || "#58db5b";
}

function worldShape(id, color, state, spec) {
  const baseFace = face(1024, 915, 0.95, state, { noAccents: id !== "sun" });
  const excited = state === "excited";
  const happy = state === "happy" || excited;
  const z = state === "empty" ? `<text x="1310" y="515" font-family="Arial" font-size="96" font-weight="900" fill="#2f69d9">z</text>` : "";
  if (id === "sun") return `<circle cx="1024" cy="980" r="350" fill="${color}" stroke="#102746" stroke-width="34"/>${Array.from({ length: 14 }, (_, i) => {
    const a = i * Math.PI / 7; const x1 = 1024 + Math.cos(a) * 420; const y1 = 980 + Math.sin(a) * 420; const x2 = 1024 + Math.cos(a) * 535; const y2 = 980 + Math.sin(a) * 535;
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#ff9b2e" stroke-width="48" stroke-linecap="round"/>`;
  }).join("")}${baseFace}`;
  if (id === "moon") return `<path d="M1210 490 C900 560 730 830 772 1110 C812 1388 1062 1538 1348 1452 C1070 1310 978 1052 1068 800 C1120 654 1190 555 1210 490Z" fill="${color}" stroke="#102746" stroke-width="34"/>${face(1038, 930, .82, state)}${z}`;
  if (id === "cloud") return `<path d="M642 1190 C492 1176 400 1070 430 934 C462 794 596 742 706 790 C780 604 1012 548 1166 690 C1260 642 1398 676 1460 786 C1628 808 1718 948 1672 1102 C1626 1252 1478 1308 1328 1286 H670Z" fill="${color}" stroke="#102746" stroke-width="34"/>${face(1024, 990, .82, state)}${z}`;
  if (id === "rainbow") return `<path d="M472 1280 A552 552 0 0 1 1576 1280" fill="none" stroke="#ef5954" stroke-width="170"/><path d="M586 1280 A438 438 0 0 1 1462 1280" fill="none" stroke="#ffd33f" stroke-width="130"/><path d="M690 1280 A334 334 0 0 1 1358 1280" fill="none" stroke="#52b357" stroke-width="96"/><path d="M780 1280 A244 244 0 0 1 1268 1280" fill="none" stroke="#2f95df" stroke-width="74"/><g transform="translate(0 170)">${face(1024, 990, .72, state)}</g>${z}`;
  if (id === "rocket") return `<path d="M1024 360 C1240 590 1320 1000 1190 1390 H858 C728 1000 808 590 1024 360Z" fill="#fff" stroke="#102746" stroke-width="34"/><path d="M858 1160 L626 1428 L850 1362Z" fill="#ef5954" stroke="#102746" stroke-width="28"/><path d="M1190 1160 L1422 1428 L1198 1362Z" fill="#ef5954" stroke="#102746" stroke-width="28"/><circle cx="1024" cy="760" r="124" fill="#9ee7ff" stroke="#102746" stroke-width="26"/><path d="M890 1390 Q1024 ${happy ? 1700 : 1510} 1158 1390" fill="${spec.fill}" opacity=".9"/>${face(1024, 1038, .72, state)}${z}`;
  if (id === "earth") return `<circle cx="1024" cy="980" r="410" fill="#2f95df" stroke="#102746" stroke-width="34"/><path d="M790 740 C890 680 1020 720 990 850 C930 930 778 890 790 740Z" fill="#52b357"/><path d="M1110 1030 C1238 930 1420 990 1360 1180 C1226 1240 1088 1184 1110 1030Z" fill="#52b357"/>${baseFace}`;
  if (id === "robot") return `<rect x="640" y="560" width="768" height="680" rx="120" fill="#eaf4ff" stroke="#102746" stroke-width="34"/><rect x="760" y="710" width="528" height="246" rx="70" fill="#102746"/><circle cx="890" cy="830" r="42" fill="#91e3e4"/><circle cx="1158" cy="830" r="42" fill="#91e3e4"/><path d="M900 1030 Q1024 ${happy ? 1130 : 1070} 1148 1030" fill="none" stroke="#102746" stroke-width="28" stroke-linecap="round"/><path d="M1024 560 V430" stroke="#102746" stroke-width="32" stroke-linecap="round"/><circle cx="1024" cy="390" r="48" fill="${spec.fill}" stroke="#102746" stroke-width="20"/>${limbs(1024, 1230, .78, color, state)}${z}`;
  if (id === "magnifier") return `<circle cx="900" cy="850" r="310" fill="#dff5ff" opacity=".82" stroke="#102746" stroke-width="42"/><path d="M1128 1078 L1460 1410" stroke="#102746" stroke-width="86" stroke-linecap="round"/><path d="M900 650 C1020 740 1040 920 930 1040" fill="none" stroke="#fff" stroke-width="42" opacity=".7"/>${face(900, 850, .66, state)}${z}`;
  if (id === "pencil") return `<g transform="rotate(-18 1024 1024)"><rect x="560" y="760" width="920" height="280" rx="80" fill="${color}" stroke="#102746" stroke-width="34"/><path d="M1480 760 L1700 900 L1480 1040Z" fill="#f0c58a" stroke="#102746" stroke-width="30"/><path d="M1700 900 L1578 940 L1578 860Z" fill="#102746"/><rect x="500" y="760" width="150" height="280" rx="60" fill="#ff7ca8" stroke="#102746" stroke-width="30"/>${face(1010, 902, .58, state)}</g>${z}`;
  if (id === "book") return `<path d="M500 570 H1018 Q1080 610 1080 710 V1390 Q1010 1340 500 1360Z" fill="${color}" stroke="#102746" stroke-width="34"/><path d="M1548 570 H1030 Q968 610 968 710 V1390 Q1038 1340 1548 1360Z" fill="#7ddf87" stroke="#102746" stroke-width="34"/><path d="M1024 628 V1392" stroke="#102746" stroke-width="24"/>${face(1024, 930, .72, state)}${z}`;
  if (id === "paintbrush") return `<g transform="rotate(28 1024 1024)"><rect x="930" y="520" width="188" height="880" rx="76" fill="#f28b30" stroke="#102746" stroke-width="32"/><path d="M900 1350 C850 1510 1000 1640 1024 1740 C1048 1640 1198 1510 1148 1350Z" fill="#7d4a2a" stroke="#102746" stroke-width="30"/>${face(1024, 920, .6, state)}</g>${z}`;
  if (id === "music-note") return `<path d="M1120 470 V1190 C1120 1355 980 1450 835 1400 C710 1356 700 1220 812 1155 C902 1102 1010 1128 1060 1190 V610 L1420 560 V1110 C1420 1270 1280 1365 1135 1315" fill="${color}" stroke="#102746" stroke-width="34" stroke-linejoin="round"/>${face(1090, 900, .64, state)}${z}`;
  if (id === "clock") return `<circle cx="1024" cy="980" r="430" fill="#f8fbff" stroke="#102746" stroke-width="36"/><circle cx="1024" cy="980" r="28" fill="#102746"/><path d="M1024 980 L1024 720 M1024 980 L1220 1080" stroke="#102746" stroke-width="32" stroke-linecap="round"/>${face(1024, 1110, .68, state)}${z}`;
  if (id === "calendar") return `<rect x="540" y="560" width="968" height="860" rx="100" fill="#fff" stroke="#102746" stroke-width="34"/><rect x="540" y="560" width="968" height="190" rx="100" fill="${color}" stroke="#102746" stroke-width="34"/><g stroke="#d8e3ee" stroke-width="16">${[820,1060,1300].map(x=>`<path d="M${x} 810 V1350"/>`).join("")}${[950,1110,1270].map(y=>`<path d="M610 ${y} H1440"/>`).join("")}</g>${face(1024, 1040, .66, state)}${z}`;
  if (id === "puzzle") return `<path d="M620 610 H940 C920 500 1008 430 1100 470 C1180 505 1195 590 1138 610 H1430 V930 C1540 910 1610 998 1570 1090 C1535 1170 1450 1185 1430 1128 V1440 H620 V1120 C510 1140 440 1052 480 960 C515 880 600 865 620 922Z" fill="${color}" stroke="#102746" stroke-width="34"/>${face(1024, 1010, .72, state)}${z}`;
  if (id === "water") return `<path d="M1024 430 C830 670 650 910 650 1160 C650 1378 818 1534 1024 1534 C1230 1534 1398 1378 1398 1160 C1398 910 1218 670 1024 430Z" fill="${color}" stroke="#102746" stroke-width="34"/>${face(1024, 1040, .76, state)}${z}`;
  if (id === "tree") return `<rect x="924" y="1030" width="200" height="450" rx="70" fill="#9a6538" stroke="#102746" stroke-width="30"/><circle cx="820" cy="820" r="230" fill="#58b957" stroke="#102746" stroke-width="28"/><circle cx="1060" cy="700" r="260" fill="#68ca61" stroke="#102746" stroke-width="28"/><circle cx="1260" cy="895" r="230" fill="#58b957" stroke="#102746" stroke-width="28"/>${face(1024, 885, .68, state)}${z}`;
  if (id === "train") return `<rect x="520" y="820" width="930" height="420" rx="120" fill="${color}" stroke="#102746" stroke-width="34"/><rect x="680" y="650" width="240" height="210" rx="60" fill="#ef5954" stroke="#102746" stroke-width="30"/><rect x="950" y="690" width="300" height="190" rx="50" fill="#ffd33f" stroke="#102746" stroke-width="28"/><circle cx="740" cy="1260" r="86" fill="#102746"/><circle cx="1210" cy="1260" r="86" fill="#102746"/>${face(1000, 990, .62, state)}${z}`;
  if (id === "dinosaur") return `<path d="M610 1170 C690 780 1130 650 1390 910 C1560 1080 1505 1370 1260 1430 H820 C650 1430 560 1330 610 1170Z" fill="${color}" stroke="#102746" stroke-width="34"/><path d="M860 760 L930 620 L1010 760 L1090 620 L1170 785" fill="#ffd33f" stroke="#102746" stroke-width="24"/><path d="M1390 980 C1570 980 1680 1080 1720 1240" fill="none" stroke="#102746" stroke-width="54" stroke-linecap="round"/>${face(1060, 1000, .68, state)}${z}`;
  if (id === "treasure") return `<path d="M520 900 Q1024 520 1528 900 V1440 H520Z" fill="#c9893f" stroke="#102746" stroke-width="34"/><rect x="520" y="920" width="1008" height="520" rx="70" fill="#b87934" stroke="#102746" stroke-width="34"/><path d="M520 1030 H1528 M1024 900 V1440" stroke="#102746" stroke-width="26"/><rect x="944" y="1090" width="160" height="140" rx="34" fill="#ffd33f" stroke="#102746" stroke-width="22"/>${face(1024, 1015, .58, state)}${z}`;
  return `<circle cx="1024" cy="980" r="390" fill="${color}" stroke="#102746" stroke-width="34"/>${baseFace}${z}`;
}

function planetSvg(record, state) {
  const key = record.id;
  const [a, b] = planetStyles[key] || ["#91e3e4", "#3769d9"];
  const ring = key === "saturn" || key === "uranus";
  const sun = key === "sun";
  const moon = key === "moon";
  const content = `<g filter="url(#shadow)">
    ${sun ? Array.from({ length: 16 }, (_, i) => {
      const ang = i * Math.PI / 8; return `<path d="M${1024 + Math.cos(ang) * 440} ${980 + Math.sin(ang) * 440} L${1024 + Math.cos(ang) * 560} ${980 + Math.sin(ang) * 560}" stroke="#ff9b2e" stroke-width="50" stroke-linecap="round"/>`;
    }).join("") : ""}
    ${ring ? `<ellipse cx="1024" cy="1000" rx="620" ry="150" fill="none" stroke="#d9c078" stroke-width="62" opacity=".82"/>` : ""}
    <circle cx="1024" cy="980" r="${moon ? 350 : 390}" fill="${a}" stroke="#102746" stroke-width="34"/>
    <path d="M720 780 C850 690 1060 720 1160 820 C1020 870 860 880 720 780Z" fill="${b}" opacity=".72"/>
    <path d="M830 1180 C980 1090 1230 1120 1360 1240 C1190 1320 990 1310 830 1180Z" fill="${b}" opacity=".62"/>
    ${key === "jupiter" ? `<ellipse cx="1120" cy="1040" rx="120" ry="62" fill="#b85a45" opacity=".8"/>` : ""}
    ${key === "moon" ? `<circle cx="830" cy="790" r="48" fill="#aab2c1" opacity=".75"/><circle cx="1180" cy="1120" r="66" fill="#aab2c1" opacity=".7"/>` : ""}
    ${face(1024, 960, .78, state)}
    ${state === "empty" ? `<text x="1300" y="540" font-family="Arial" font-size="92" font-weight="900" fill="#2f69d9">z</text>` : ""}
  </g>`;
  const transform = {
    empty: "translate(0 38) scale(.97)",
    low: "translate(0 20) scale(.985)",
    calm: "translate(0 0) scale(1)",
    happy: "translate(0 -24) scale(1.025)",
    excited: "translate(0 -44) scale(1.045)"
  }[state];
  return shell(`<g transform="${transform}">${content}</g>`, a, state, stateSpec[state].accent);
}

async function writeAsset(assetRoot, state, svg) {
  const dir = path.join(root, assetRoot, state);
  await fs.mkdir(dir, { recursive: true });
  const master = path.join(dir, "master.png");
  const web = path.join(dir, "web.webp");
  await sharp(Buffer.from(svg)).png().toFile(master);
  await sharp(master).webp({ quality: 88, effort: 5 }).toFile(web);
  return { masterPath: path.relative(root, master), webPath: path.relative(root, web) };
}

async function buildContact(characterId, assetRoot) {
  const outDir = path.join(root, "qa/character-production-v3", characterId);
  await fs.mkdir(outDir, { recursive: true });
  const width = 360 * states.length;
  const base = Buffer.from(`<svg width="${width}" height="482" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fff"/><rect width="20" height="20" fill="#d9e5f2"/><rect x="20" y="20" width="20" height="20" fill="#d9e5f2"/></pattern></defs><rect width="${width}" height="88" fill="#f8fbff"/><rect y="88" width="${width}" height="394" fill="url(#c)"/></svg>`);
  const composites = [];
  for (const [index, state] of states.entries()) {
    const img = await sharp(path.join(root, assetRoot, state, "master.png")).resize({ width: 300, height: 300, fit: "contain" }).png().toBuffer();
    composites.push({ input: img, left: index * 360 + 30, top: 132 });
    composites.push({ input: Buffer.from(`<svg width="360" height="88" xmlns="http://www.w3.org/2000/svg"><text x="180" y="34" text-anchor="middle" font-family="Arial" font-size="25" font-weight="900" fill="#102746">${state.toUpperCase()}</text></svg>`), left: index * 360, top: 0 });
  }
  await sharp(base).composite(composites).png().toFile(path.join(outDir, "five-states.png"));
  return path.relative(root, path.join(outDir, "five-states.png"));
}

async function main() {
  const built = [];
  for (const guide of guides) {
    console.log(`Building ${guide.id}`);
    for (const state of states) await writeAsset(guide.root, state, guideSvg(guide, state));
    built.push({ ...guide, characterId: guide.id, contactSheet: `qa/character-production-v3/${guide.id}/five-states.png` });
  }
  for (const item of alphabet) {
    console.log(`Building ${item.id}`);
    const letter = item.id.replace("letter-", "");
    const assetRoot = `assets/characters-v2/alphabet/${letter}`;
    for (const state of states) await writeAsset(assetRoot, state, glyphSvg(item, state, "alphabet"));
    built.push({ id: item.id, characterId: item.id, displayName: `Letter ${item.uppercase}`, family: "alphabet", root: assetRoot, sourceReference: "data/alphabet.json", contactSheet: `qa/character-production-v3/${item.id}/five-states.png` });
  }
  for (const item of numbers) {
    console.log(`Building ${item.id}`);
    const value = String(item.value);
    const assetRoot = `assets/characters-v2/numbers/${value}`;
    for (const state of states) await writeAsset(assetRoot, state, glyphSvg(item, state, "number"));
    built.push({ id: item.id, characterId: item.id, displayName: `Number ${value}`, family: "numbers", root: assetRoot, sourceReference: "data/numbers.json", contactSheet: `qa/character-production-v3/${item.id}/five-states.png` });
  }
  for (const item of world) {
    if (item.id === "world-battery" || item.id === "battery-buddy") continue;
    console.log(`Building ${item.id}`);
    const simpleId = item.id.replace(/^world-/, "");
    const assetRoot = `assets/characters-v2/world/${simpleId}`;
    for (const state of states) await writeAsset(assetRoot, state, worldSvg(item, state));
    built.push({ id: item.id, characterId: item.id, displayName: item.displayName, family: "world", root: assetRoot, sourceReference: "data/world-characters.json", contactSheet: `qa/character-production-v3/${item.id}/five-states.png` });
  }
  for (const item of planets) {
    console.log(`Building ${item.characterId}`);
    const assetRoot = `assets/characters-v2/planets/${item.id}`;
    for (const state of states) await writeAsset(assetRoot, state, planetSvg(item, state));
    built.push({ id: item.characterId, characterId: item.characterId, displayName: item.displayName, family: "planet", root: assetRoot, sourceReference: "data/planets.json", contactSheet: `qa/character-production-v3/${item.characterId}/five-states.png` });
  }
  await fs.mkdir(path.join(root, "qa/character-production-v3"), { recursive: true });
  await fs.writeFile(path.join(root, "qa/character-production-v3/build-report.json"), JSON.stringify({ builtAt: new Date().toISOString(), states, built }, null, 2));
  console.log(`Built ${built.length} non-Battery characters (${built.length * states.length} state assets).`);
}

await main();
