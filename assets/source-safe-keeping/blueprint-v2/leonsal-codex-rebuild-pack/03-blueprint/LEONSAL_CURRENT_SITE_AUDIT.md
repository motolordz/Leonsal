# LeonSal.com Current-Site Audit

## Executive finding

The current LeonSal build is a useful prototype, but it is not yet a polished children’s game platform. It still behaves like a long experimental sensory page with several scripts layered onto static HTML. The recent character work separated 40 transparent PNGs, but it did not convert the site into a genuine animation/game system. Most movement remains CSS transforms, background sprites or swaps between flattened images.

The correct next step is a controlled V2 build in parallel, reusing good content and proven ideas while replacing the presentation, interaction and rendering architecture.

## What materially changed

- A shared five-state naming model exists: `empty`, `low`, `calm`, `happy`, `excited`.
- Forty individual PNG files exist for Leon, Zaya, Battery Buddy, Elephant, Double-decker, Plane, Boat and Letter A.
- Rejected bulk crops were quarantined.
- Leon and Zaya no longer need to inherit Battery Buddy when the registry is correct.
- The three original game routes remain present.

These changes are foundations, not a complete product redesign.

## Why the live site still feels low-budget

### 1. The homepage is doing too many jobs

The same long page contains character selection, an energy board, sensory choices, feelings, a body board, multiple sensory activities, learning-game links and grown-up notes. On mobile this creates a very long scroll and makes it difficult for a child to understand where a game begins and ends.

A high-grade product should use:

- a short game-world homepage;
- one full-screen game stage per route;
- a consistent pause/settings drawer;
- a clear beginning, activity, finish and next choice.

### 2. The sensory toolbar occupies valuable play space

The current sticky controls are visually large and remain at the top while the child plays. On an iPhone they can consume a significant part of the usable viewport and separate the child from the active game.

V2 should expose one visible calm/settings button and open a drawer only when requested. Critical controls such as Home, Pause and Stop Sound remain immediately available without permanently covering the stage.

### 3. “Motion” is mostly an image being moved

The current system still uses:

- CSS background sprite positions from `assets/character-worlds.png`;
- raster PNG state swaps;
- CSS bounce, rotate and translate effects;
- JavaScript that changes `background-image` or `<img src>`.

That can make an object appear to move, but it does not create the fluid, reactive behaviour expected from a modern interactive game. A battery should continuously drain and fill; eyes, mouth, body posture and glow should respond; a plane should bank and accelerate; bubbles should have physical movement; a trail should follow the finger smoothly.

### 4. Static five-image character states are insufficient as the final animation system

Five transparent PNGs are useful fallback key poses, but they do not provide:

- in-between motion;
- facial interpolation;
- responsive arm/leg movement;
- continuous energy change;
- reusable walk, idle, sleep, celebrate and point animations;
- smooth direction changes.

Leon, Zaya and recurring mascots need a real animation format: preferably Rive state machines, or a well-built sprite atlas when vector rigging is not practical.

### 5. Visual styles are inconsistent

The current material combines:

- glossy 3D characters;
- flat DOM shapes;
- emojis;
- CSS-drawn battery objects;
- different shadows and lighting;
- several generations of Leon and Zaya artwork.

V2 needs one art direction, one outline/shading language, consistent proportions and a controlled palette. Emojis can remain temporary icons but must not be the primary game art.

### 6. The code does not scale safely to 30–60 games

The current approach uses multiple page-level CSS and JavaScript files that know about specific DOM IDs. Adding dozens of games this way will create more conflicting listeners, duplicate state, broken selectors and regressions.

V2 needs:

- a game-module lifecycle;
- a data-driven route registry;
- shared input, audio, progress and sensory services;
- lazy-loaded game bundles;
- automated link, visual, performance and interaction tests.

### 7. Position and energy were previously conflated

The Charging Dock problem illustrates a larger architecture issue. Travel position and stored energy are different pieces of state. A high-grade engine must model them separately and emit explicit events such as `dock-enter`, `charge-start`, `charge-progress`, `charge-complete` and `round-reset`.

### 8. There is no strong visual completion language

Each game should clearly show:

1. what to do;
2. the active interaction;
3. when it is finished;
4. what happens next.

The current page often leaves status messages, controls and other activities visible together. V2 should use stable scenes and an explicit finished card.

## Current asset assessment

### Original source images

Most source files are posters, contact sheets, concept banners or multi-character grids. They are valuable art references but are not production sprites.

### Current 40 PNG pilot

The current pilot PNGs do contain transparent areas and are separated into five states. However:

- they originate from flattened reference sheets;
- edge quality and scale vary;
- lighting and canvas occupancy vary;
- they remain static poses;
- they should be reviewed one by one before production use.

They are included in this pack under `02-current-pilot-pngs-review-only/` precisely so Codex can compare them against the references and reject any weak asset.

## Product decision

Do not continue patching the current single-page structure as the primary product.

Build LeonSal V2 in a separate branch and preview path. Keep current live routes stable until the V2 shell and first five flagship interactions have passed mobile acceptance. Then migrate the original learning games into the new shell one by one.

## P0 requirements before V2 goes live

- No character can display another character’s art.
- No contact sheet or chart crop may render in a game.
- No game may require a long page scroll while playing.
- No sound or animation starts unexpectedly.
- Every drag action has a tap/button alternative.
- Motion-off pauses decorative movement without removing educational state changes.
- Home, pause and reset are always reachable.
- The first five games hold a stable frame rate on current iPhone Safari.
- The stage never sits behind a sticky toolbar or iOS safe-area obstruction.
- All game routes, assets and direct URLs are automatically verified.

## Evidence inspected

- Current `index.html` structure and script stack.
- `sensory-core.js` state handling.
- `sensory-phase2.js` character and dock logic.
- `sensory-phase2.css` sprite-sheet and character styles.
- `character-art-v2-enhancements.js` PNG/background-image integration.
- `data/character-assets.json` five-state pilot registry.
- Current 40-PNG checkerboard contact sheet.
- User-provided mobile screenshots showing the present workflow and visual quality.
