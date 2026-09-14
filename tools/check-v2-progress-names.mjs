import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const html = await fs.readFile('v2-home.html', 'utf8');
const homeJs = await fs.readFile('js/v2-home.js', 'utf8');
const routeMatches = [...html.matchAll(/href="(v2-[^"]+\.html)"[\s\S]*?<h3>(.*?)<\/h3>/g)];
const routeNames = new Map();

for (const [, route, rawName] of routeMatches) {
  const id = route.replace(/^v2-/, '').replace(/\.html$/, '');
  if (id === 'home') continue;
  routeNames.set(id, rawName.replace(/&amp;/g, '&'));
}

const explicitIds = [];
for (const file of await fs.readdir('.')) {
  if (!/^v2-.*\.html$/.test(file)) continue;
  const source = await fs.readFile(file, 'utf8');
  const match = source.match(/gameId:\s*'([^']+)'/);
  if (match) explicitIds.push(match[1]);
}

for (const id of new Set([...routeNames.keys(), ...explicitIds])) {
  assert(homeJs.includes(`'${id}':`), `Missing local progress display name for ${id}`);
}

for (const [id, name] of routeNames) {
  if (homeJs.includes(`'${id}':`)) assert(homeJs.includes(name), `Progress name for ${id} should include "${name}"`);
}

assert(homeJs.includes("notIncluded: ['scores', 'grades', 'mastery claims'"), 'Progress export must remain no-score/no-diagnosis');

console.log(`V2 progress name checks passed for ${new Set([...routeNames.keys(), ...explicitIds]).size} activity ids.`);
