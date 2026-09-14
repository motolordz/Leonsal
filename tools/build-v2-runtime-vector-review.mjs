import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const outDir = path.join(root, 'qa/character-production-v3/RUNTIME-VECTOR-REVIEW');
const states = ['empty', 'low', 'calm', 'happy', 'excited'];
const groups = ['guides', 'alphabet', 'numbers', 'world', 'planets'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const registry = JSON.parse(await fs.readFile(path.join(root, 'data/character-assets.json'), 'utf8'));
const records = [];
for (const group of groups) {
  for (const record of registry[group] || []) {
    records.push({
      id: record.id,
      displayName: record.displayName,
      family: record.family === 'numbers' ? 'number' : record.family,
      uppercase: record.uppercase,
      status: record.status
    });
  }
}

await fs.mkdir(outDir, { recursive: true });

const server = http.createServer(async (req, res) => {
  const file = path.resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) return res.writeHead(403).end();
  try {
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const errors = [];
const requests = [];

try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto(`${base}/v2-character-world.html`, { waitUntil: 'networkidle' });
  await page.evaluate(({ records, states }) => {
    const host = document.createElement('main');
    host.className = 'runtime-vector-review';
    host.innerHTML = `
      <style>
        body { margin: 0; background: #f4fbff; font-family: Arial, sans-serif; color: #102746; }
        .runtime-vector-review { width: 1800px; padding: 28px; box-sizing: border-box; }
        h1 { margin: 0 0 6px; font-size: 34px; }
        .note { margin: 0 0 24px; color: #52617a; font-weight: 700; }
        .family { margin: 0 0 26px; padding: 18px; border-radius: 24px; background: rgba(255,255,255,.82); box-shadow: 0 18px 42px rgba(35,79,140,.12); }
        .family h2 { margin: 0 0 14px; font-size: 24px; }
        .row { display: grid; grid-template-columns: 190px repeat(5, 1fr); gap: 10px; align-items: center; margin: 0 0 12px; }
        .name { font-size: 16px; font-weight: 900; }
        .status { display: block; margin-top: 4px; font-size: 11px; color: #6b7890; text-transform: uppercase; letter-spacing: .08em; }
        .cell { height: 132px; display: grid; place-items: center; border-radius: 18px; background-image: linear-gradient(45deg, #dfeaf5 25%, transparent 25%), linear-gradient(-45deg, #dfeaf5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dfeaf5 75%), linear-gradient(-45deg, transparent 75%, #dfeaf5 75%); background-size: 24px 24px; background-position: 0 0, 0 12px, 12px -12px, -12px 0; background-color: #fff; overflow: hidden; }
        .cell .procedural-character-svg { width: 124px; height: 124px; }
        .state-head { text-align: center; font-size: 13px; font-weight: 1000; color: #355e8d; text-transform: uppercase; }
      </style>
      <h1>LeonSal Runtime Vector Five-State Review</h1>
      <p class="note">Generated from js/v2-character-renderer.js. Pending vectors are previews only; approved production image status is unchanged.</p>`;
    const renderer = window.LeonSalCharacterRenderer;
    const byFamily = new Map();
    for (const record of records) {
      const family = record.family === 'planet' ? 'planets' : record.family;
      if (!byFamily.has(family)) byFamily.set(family, []);
      byFamily.get(family).push(record);
    }
    for (const [family, items] of byFamily) {
      const section = document.createElement('section');
      section.className = 'family';
      const heading = document.createElement('h2');
      heading.textContent = family === 'guide' ? 'Leon and Zaya' : family;
      section.append(heading);
      const head = document.createElement('div');
      head.className = 'row';
      head.innerHTML = `<span></span>${states.map(state => `<span class="state-head">${state}</span>`).join('')}`;
      section.append(head);
      for (const record of items) {
        const row = document.createElement('div');
        row.className = 'row';
        const name = document.createElement('div');
        name.className = 'name';
        name.innerHTML = `${record.displayName || record.id}<span class="status">${record.status}</span>`;
        row.append(name);
        for (const state of states) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.append(renderer.makeCharacter(record, state, { decorative: true }));
          row.append(cell);
        }
        section.append(row);
      }
      host.append(section);
    }
    document.body.replaceChildren(host);
  }, { records, states });
  await page.screenshot({ path: path.join(outDir, 'runtime-vector-five-state-review.png'), fullPage: true });
  const forbiddenRequests = requests.filter(url => /source-safe-keeping|qa\/|contact-sheet|rejected|assets\/character-review|_staging/i.test(url));
  if (errors.length || forbiddenRequests.length) {
    throw new Error(JSON.stringify({ errors, forbiddenRequests }, null, 2));
  }
  await fs.writeFile(path.join(outDir, 'runtime-vector-review-summary.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'js/v2-character-renderer.js',
    productionApprovalChanged: false,
    records: records.length,
    states,
    screenshot: 'qa/character-production-v3/RUNTIME-VECTOR-REVIEW/runtime-vector-five-state-review.png',
    runtimeRule: 'This QA sheet is evidence only. Pending vectors remain preview/fallback artwork and must not be counted as approved production image assets.'
  }, null, 2) + '\n');
  console.log(`Runtime vector review generated for ${records.length} characters.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
