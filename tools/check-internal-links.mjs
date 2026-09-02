import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const gamesPath = path.join(root, "data", "games.json");
const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));

const failures = [];

for (const game of games) {
  if (game.status === "planned" && game.showInUniverse === false) {
    continue;
  }

  if (!game.route || path.isAbsolute(game.route) || game.route.includes("://")) {
    failures.push(`${game.id}: route must be a root-relative local file name`);
    continue;
  }

  const target = path.join(root, game.route);
  if (!fs.existsSync(target)) {
    failures.push(`${game.id}: missing route ${game.route}`);
  }
}

if (failures.length > 0) {
  console.error("Internal link check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Internal link check passed for ${games.length} game routes.`);
