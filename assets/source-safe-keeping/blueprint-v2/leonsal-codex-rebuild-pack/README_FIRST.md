# LeonSal.com V2 Codex Rebuild Pack

This pack contains the current LeonSal visual references, the existing 40-PNG pilot set, a researched V2 architecture, reusable interaction-engine specifications, a 30-game launch roadmap, acceptance gates, a standalone smooth-engine showcase and a master Codex implementation prompt.

## Start here

1. Upload this entire folder or the ZIP to Codex.
2. Tell Codex to read `03-blueprint/LEONSAL_MASTER_CODEX_PROMPT.md` first.
3. Codex must then read `03-blueprint/AGENTS_LEONSAL_V2.md` and the other blueprint files before changing the repository.
4. Build V2 on a separate branch. Do not patch the current live site into an even larger single-page prototype.
5. Stop after each milestone and provide a preview plus mobile screenshots before continuing.

## Important asset truth

The files in `02-current-pilot-pngs-review-only/` are the current 40 individual transparent PNGs for Leon, Zaya, Battery Buddy, Elephant, Double-decker, Plane, Boat and Letter A. They are included so Codex can inspect what exists. They are **not automatically approved as final art**. The user has judged the current live result visually shonky, so each asset must pass visual review before reuse.

The files in `01-source-images/` are references. Many are contact sheets or posters. A contact sheet must never be displayed directly in a game and must never be treated as a ready-to-use animated asset.

## Correct visual strategy

- Procedural concepts such as batteries, clocks, shapes, number bars, planets, bubbles, rain, trails and particles should be SVG/Canvas/WebGL objects, not static screenshots.
- Leon, Zaya and recurring mascots should become Rive state-machine characters or properly animated sprite atlases. Five unrelated PNG swaps are only a temporary fallback.
- Every game must have one clear stage, one task, a visible Home/Back control and sensory controls that do not obscure the game.

## Included folders

- `01-source-images/` — original uploads and earlier generated PNG references.
- `02-current-pilot-pngs-review-only/` — current 40 transparent PNG pilot assets and checkerboard sheet.
- `03-blueprint/` — audit, architecture, engine design, game roadmap, standards and master prompt.
- `04-prototypes/` — standalone smooth interaction-engine showcase.
- `05-machine-readable/` — JSON registries for engines, games and source assets.
- `06-site-issue-screenshots/` — examples of current UX/logic problems.

## First V2 acceptance target

The first accepted V2 preview should contain:

1. A proper game-world homepage.
2. A full-screen game shell.
3. A global sensory settings drawer.
4. A procedural Energy Battery Lab.
5. Charging Dock Dash with separate movement and energy values.
6. Quiet Bubble Garden.
7. Finger Light Trail.
8. Hold to Breathe.
9. Shape Snap Builder.

Nothing goes live until it passes iPhone visual and interaction testing.
