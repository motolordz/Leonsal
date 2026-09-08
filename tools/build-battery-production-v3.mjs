import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceImage = "/var/folders/ns/grw4d6nd0997k04xk218hv0r0000gn/T/codex-clipboard-0a33daa8-70a1-439d-9158-b2f056f87fbf.png";
const outRoot = path.join(root, "assets/characters-v2/battery");
const sourceOut = path.join(root, "assets/source-safe-keeping/approved-character-sheets-v2/battery-five-state-v3-source.png");
const qaRoot = path.join(root, "qa/battery-production-v3");

const states = [
  {
    id: "empty",
    percent: 0,
    fill: "#ef6470",
    fillHeight: 72,
    fillOpacity: 0.92,
    liquidY: 1370,
    eye: "closed",
    mouth: "sleepy",
    glow: "#ffd9de",
    rays: false
  },
  {
    id: "low",
    percent: 25,
    fill: "#ff8f37",
    fillHeight: 318,
    fillOpacity: 0.95,
    liquidY: 1124,
    eye: "tired",
    mouth: "smallSmile",
    glow: "#ffe3c5",
    rays: false
  },
  {
    id: "calm",
    percent: 50,
    fill: "#ffd33f",
    fillHeight: 545,
    fillOpacity: 0.95,
    liquidY: 897,
    eye: "open",
    mouth: "calmSmile",
    glow: "#fff0aa",
    rays: false
  },
  {
    id: "happy",
    percent: 75,
    fill: "#58db5b",
    fillHeight: 795,
    fillOpacity: 0.95,
    liquidY: 647,
    eye: "open",
    mouth: "happySmile",
    glow: "#c8ffd0",
    rays: false
  },
  {
    id: "excited",
    percent: 100,
    fill: "#1fc9f5",
    fillHeight: 1088,
    fillOpacity: 0.97,
    liquidY: 354,
    eye: "wide",
    mouth: "openSmile",
    glow: "#bff4ff",
    rays: true
  }
];

function faceMarkup(state) {
  const cx = 1024;
  const leftX = 845;
  const rightX = 1203;
  const eyeY = state.eye === "closed" ? 828 : state.eye === "tired" ? 835 : 812;
  const cheekY = 945;
  const cheek = `<ellipse cx="740" cy="${cheekY}" rx="74" ry="43" fill="#ff9aa5" opacity=".72"/>
  <ellipse cx="1308" cy="${cheekY}" rx="74" ry="43" fill="#ff9aa5" opacity=".72"/>`;

  if (state.eye === "closed") {
    return `
      <path d="M742 804 C800 858 869 858 928 804" fill="none" stroke="#102746" stroke-width="40" stroke-linecap="round"/>
      <path d="M1120 804 C1178 858 1248 858 1306 804" fill="none" stroke="#102746" stroke-width="40" stroke-linecap="round"/>
      ${cheek}
      <path d="M963 1038 C1002 995 1046 995 1085 1038 C1072 1088 976 1088 963 1038Z" fill="#102746"/>
      <path d="M990 1050 C1015 1032 1038 1032 1062 1050" fill="none" stroke="#ff7c88" stroke-width="20" stroke-linecap="round"/>`;
  }

  const eyelid = state.eye === "tired"
    ? `<path d="M727 766 C780 715 863 711 927 755" fill="none" stroke="#102746" stroke-width="30" stroke-linecap="round"/>
       <path d="M1121 755 C1184 711 1267 715 1320 766" fill="none" stroke="#102746" stroke-width="30" stroke-linecap="round"/>`
    : `<path d="M738 746 C793 704 867 704 921 746" fill="none" stroke="#102746" stroke-width="30" stroke-linecap="round"/>
       <path d="M1127 746 C1182 704 1256 704 1311 746" fill="none" stroke="#102746" stroke-width="30" stroke-linecap="round"/>`;

  const eyeScale = state.eye === "wide" ? 1.08 : 1;
  const eyes = `
    ${eyelid}
    <ellipse cx="${leftX}" cy="${eyeY}" rx="${72 * eyeScale}" ry="${86 * eyeScale}" fill="#102746"/>
    <ellipse cx="${rightX}" cy="${eyeY}" rx="${72 * eyeScale}" ry="${86 * eyeScale}" fill="#102746"/>
    <ellipse cx="${leftX + 20}" cy="${eyeY - 28}" rx="25" ry="32" fill="#ffffff"/>
    <ellipse cx="${rightX + 20}" cy="${eyeY - 28}" rx="25" ry="32" fill="#ffffff"/>
    <circle cx="${leftX + 41}" cy="${eyeY + 22}" r="12" fill="#ffffff" opacity=".85"/>
    <circle cx="${rightX + 41}" cy="${eyeY + 22}" r="12" fill="#ffffff" opacity=".85"/>
  `;

  const mouths = {
    smallSmile: `<path d="M908 1012 C970 1074 1078 1074 1140 1012" fill="none" stroke="#102746" stroke-width="34" stroke-linecap="round"/>`,
    calmSmile: `<path d="M887 997 C950 1082 1098 1082 1161 997" fill="none" stroke="#102746" stroke-width="36" stroke-linecap="round"/>`,
    happySmile: `<path d="M868 982 C934 1098 1114 1098 1180 982" fill="none" stroke="#102746" stroke-width="42" stroke-linecap="round"/>`,
    openSmile: `<path d="M841 958 C913 1165 1135 1165 1207 958 C1141 1024 907 1024 841 958Z" fill="#102746"/>
      <path d="M910 1081 C975 1132 1072 1132 1138 1081 C1118 1162 930 1162 910 1081Z" fill="#ff6e75"/>
      <path d="M902 982 C958 1021 1090 1021 1146 982" fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round"/>`
  };

  return `${eyes}${cheek}${mouths[state.mouth]}`;
}

function svgFor(state) {
  const fillY = state.liquidY;
  const fillH = state.fillHeight;
  const rays = state.rays ? `
    <g opacity=".9" stroke="#ffd447" stroke-width="42" stroke-linecap="round">
      <path d="M1502 614 L1620 510"/>
      <path d="M1595 838 L1764 832"/>
      <path d="M1468 1118 L1590 1238"/>
      <path d="M546 614 L428 510"/>
      <path d="M453 838 L284 832"/>
      <path d="M580 1118 L458 1238"/>
    </g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
  <defs>
    <linearGradient id="metal" x1="0" x2="1">
      <stop offset="0" stop-color="#7b8797"/>
      <stop offset=".23" stop-color="#eef4fb"/>
      <stop offset=".48" stop-color="#9da9ba"/>
      <stop offset=".75" stop-color="#f8fbff"/>
      <stop offset="1" stop-color="#677585"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" x2="1">
      <stop offset="0" stop-color="#f8fbff" stop-opacity=".54"/>
      <stop offset=".2" stop-color="#ffffff" stop-opacity=".86"/>
      <stop offset=".42" stop-color="#ffffff" stop-opacity=".18"/>
      <stop offset=".72" stop-color="#ffffff" stop-opacity=".08"/>
      <stop offset="1" stop-color="#d9f2ff" stop-opacity=".38"/>
    </linearGradient>
    <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${state.fill}" stop-opacity=".72"/>
      <stop offset=".55" stop-color="${state.fill}" stop-opacity="${state.fillOpacity}"/>
      <stop offset="1" stop-color="${state.fill}" stop-opacity="1"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="34" stdDeviation="30" flood-color="#102746" flood-opacity=".26"/>
    </filter>
    <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="58" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="inside"><rect x="546" y="368" width="956" height="1176" rx="154"/></clipPath>
  </defs>
  ${rays}
  <ellipse cx="1024" cy="1690" rx="430" ry="72" fill="#102746" opacity=".12"/>
  <ellipse cx="1024" cy="986" rx="600" ry="680" fill="${state.glow}" opacity=".52" filter="url(#softGlow)"/>
  <g filter="url(#shadow)">
    <rect x="782" y="218" width="484" height="188" rx="52" fill="url(#metal)" stroke="#102746" stroke-width="28"/>
    <rect x="484" y="304" width="1080" height="1320" rx="186" fill="#dce9f7" stroke="#102746" stroke-width="36"/>
    <rect x="546" y="368" width="956" height="1176" rx="154" fill="#f9fbff" stroke="#45627f" stroke-width="16"/>
    <g clip-path="url(#inside)">
      <rect x="546" y="${fillY}" width="956" height="${fillH}" fill="url(#fill)"/>
      <ellipse cx="1024" cy="${fillY + 12}" rx="478" ry="58" fill="${state.fill}" opacity=".48"/>
      <rect x="546" y="368" width="956" height="1176" fill="url(#glass)"/>
      <rect x="640" y="406" width="124" height="1090" rx="62" fill="#ffffff" opacity=".42"/>
      <rect x="1338" y="438" width="72" height="980" rx="36" fill="#ffffff" opacity=".2"/>
    </g>
    ${faceMarkup(state)}
  </g>
</svg>`;
}

async function main() {
  await fs.mkdir(path.dirname(sourceOut), { recursive: true });
  await fs.copyFile(sourceImage, sourceOut);
  await fs.mkdir(qaRoot, { recursive: true });

  const written = [];
  for (const state of states) {
    const stateDir = path.join(outRoot, state.id);
    await fs.mkdir(stateDir, { recursive: true });
    const svg = Buffer.from(svgFor(state));
    const masterPath = path.join(stateDir, "master.png");
    const webPath = path.join(stateDir, "web.webp");
    await sharp(svg).png().toFile(masterPath);
    await sharp(masterPath).webp({ quality: 88, effort: 5 }).toFile(webPath);
    written.push({
      state: state.id,
      percent: state.percent,
      masterPath: path.relative(root, masterPath),
      webPath: path.relative(root, webPath),
      dimensions: await sharp(masterPath).metadata()
    });
  }

  const sheetWidth = 360 * states.length;
  const checker = Buffer.from(`<svg width="${sheetWidth}" height="482" xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#ffffff"/><rect width="20" height="20" fill="#d9e5f2"/>
      <rect x="20" y="20" width="20" height="20" fill="#d9e5f2"/>
    </pattern></defs>
    <rect width="${sheetWidth}" height="88" fill="#f8fbff"/>
    <rect y="88" width="${sheetWidth}" height="394" fill="url(#c)"/>
  </svg>`);
  const composites = [];
  for (const [index, state] of states.entries()) {
    const masterPath = path.join(outRoot, state.id, "master.png");
    const thumb = await sharp(masterPath)
      .resize({ width: 300, height: 300, fit: "contain", withoutEnlargement: true })
      .png()
      .toBuffer();
    composites.push({ input: thumb, left: index * 360 + 30, top: 132 });
    composites.push({ input: Buffer.from(`<svg width="360" height="88" xmlns="http://www.w3.org/2000/svg">
      <text x="180" y="33" text-anchor="middle" font-family="Arial" font-size="30" font-weight="800" fill="#102746">${state.percent}%</text>
      <text x="180" y="68" text-anchor="middle" font-family="Arial" font-size="24" font-weight="800" fill="#244968">${state.id.toUpperCase()}</text>
    </svg>`), left: index * 360, top: 0 });
  }
  await sharp(checker)
    .composite(composites)
    .png()
    .toFile(path.join(qaRoot, "battery-five-production-states.png"));

  await fs.writeFile(path.join(qaRoot, "asset-build-report.json"), JSON.stringify({ sourceImage, sourceOut: path.relative(root, sourceOut), written }, null, 2));
  console.log(`Battery v3 assets written from ${sourceImage}`);
  for (const asset of written) console.log(`${asset.state}: ${asset.masterPath} ${asset.dimensions.width}x${asset.dimensions.height}`);
  console.log("QA contact sheet: qa/battery-production-v3/battery-five-production-states.png");
}

await main();
