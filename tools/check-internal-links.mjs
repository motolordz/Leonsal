import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const gamesPath = path.join(root, "data", "games.json");
const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
const gamesV2Path = path.join(root, "data", "games-v2.json");
const gamesV2 = JSON.parse(fs.readFileSync(gamesV2Path, "utf8"));

const failures = [];

function checkRoute(id, route) {
  if (!route || path.isAbsolute(route) || route.includes("://")) {
    failures.push(`${id}: route must be a root-relative local file name`);
    return;
  }
  const target = path.join(root, route);
  if (!fs.existsSync(target)) {
    failures.push(`${id}: missing route ${route}`);
  }
}

for (const game of games) {
  if (game.status === "planned" && game.showInUniverse === false) {
    continue;
  }
  checkRoute(game.id, game.route);
}

for (const game of gamesV2.games || []) {
  if (!game.route) {
    continue;
  }
  checkRoute(`v2:${game.id}`, game.route);
}

for (const route of ["v2-home.html", "v2-proof-lab.html", "v2-character-world.html", "character-review.html"]) {
  checkRoute(`page:${route}`, route);
}

if (failures.length > 0) {
  console.error("Internal link check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const v2RouteCount = (gamesV2.games || []).filter(game => game.route).length;
console.log(`Internal link check passed for ${games.length} legacy game routes, ${v2RouteCount} V2 game routes, and 4 V2 entry pages.`);
