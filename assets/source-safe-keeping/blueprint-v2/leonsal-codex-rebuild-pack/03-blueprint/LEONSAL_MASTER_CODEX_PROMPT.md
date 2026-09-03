# Copy everything below into Codex

```text
LEONSAL.COM — V2 HIGH-GRADE INTERACTIVE GAME PLATFORM
MASTER BUILD MISSION

Repository:
motolordz/Leonsal

INPUT PACK

The uploaded Codex pack contains:

- README_FIRST.md
- 01-source-images/
- 02-current-pilot-pngs-review-only/
- 03-blueprint/AGENTS_LEONSAL_V2.md
- 03-blueprint/LEONSAL_CURRENT_SITE_AUDIT.md
- 03-blueprint/LEONSAL_V2_PRODUCT_ARCHITECTURE.md
- 03-blueprint/LEONSAL_12_REUSABLE_ENGINES.md
- 03-blueprint/LEONSAL_FIRST_30_GAMES.md
- 03-blueprint/LEONSAL_ASSET_AND_ANIMATION_STANDARD.md
- 03-blueprint/LEONSAL_ACCEPTANCE_GATES.md
- 03-blueprint/LEONSAL_RESEARCH_NOTES.md
- 04-prototypes/sensory-engine-showcase.html
- 05-machine-readable/engines.json
- 05-machine-readable/games-v2.json
- 05-machine-readable/asset-manifest.json
- 06-site-issue-screenshots/

READ ORDER

1. Read the repository root AGENTS.md.
2. Read README_FIRST.md from the uploaded pack.
3. Read 03-blueprint/AGENTS_LEONSAL_V2.md completely.
4. Read the current-site audit, architecture, engines, first-30-games, asset standard and acceptance gates.
5. Inspect the standalone sensory-engine-showcase.html.
6. Inspect the actual current repository and live routes.

The uploaded pack is advisory except that AGENTS_LEONSAL_V2.md and the explicit acceptance rules in this prompt are mandatory for this mission.

==================================================
MISSION
==================================================

Build LeonSal V2 as a polished, smooth, mobile-first children’s learning and sensory game platform.

The current live site looks like a long prototype with static image movement, mixed graphics and weak game flow. Do not keep stacking patches onto it.

Build a parallel V2 architecture that:

- feels like a real children’s game product;
- uses procedural SVG/Canvas/WebGL interactions rather than screenshots;
- uses reusable game engines rather than one-off pages;
- supports 30 launch games and 60+ later;
- is predictable and sensory-friendly;
- performs smoothly on iPhone Safari;
- keeps the current live site safe until V2 is accepted.

DO NOT:

- redesign main directly;
- deploy V2 to the live custom domain yet;
- delete the current site;
- change DNS or CNAME;
- use contact sheets as runtime art;
- claim static PNG swapping is a completed animation system;
- build all 30 games in one run;
- create 30 unrelated HTML files;
- start sound automatically;
- require dragging as the only interaction;
- invent medical or therapeutic claims;
- mark weak art as approved to make percentages look complete.

==================================================
BRANCH AND SAFETY
==================================================

Inspect the exact current main head first.

Create:

build/leonsal-v2-foundation

Keep all V2 work isolated from current production.

Create a preview deployment/path that does not replace leonsal.com until explicit approval.

Do not merge anything during this milestone.

==================================================
CURRENT ART ASSESSMENT
==================================================

The uploaded source folders include:

- poster/contact-sheet references;
- prior generated PNG references;
- a current 40-PNG transparent pilot for Leon, Zaya, Battery Buddy, Elephant, Double-decker, Plane, Boat and Letter A.

Treat the 40 PNGs as REVIEW-ONLY until visual inspection.

For each current pilot PNG, inspect:

- edge halos;
- missing white details;
- clipped body parts;
- inconsistent scale;
- blur;
- unwanted source-sheet remnants;
- mismatch with canonical identity.

Do not automatically activate weak assets.

Long-term character strategy:

- Rive state machines for Leon, Zaya and recurring mascots;
- properly authored sprite atlas where Rive is not practical;
- static PNGs for thumbnails/fallback key poses only.

Do not attempt bulk automatic vectorisation from poster sheets.

==================================================
TECHNICAL FOUNDATION
==================================================

Use:

- Vite
- TypeScript
- semantic HTML/CSS for app shell and accessible controls
- Phaser for structured 2D games and physics
- SVG + Web Animations API for batteries, clocks, gauges and simple procedural objects
- Canvas 2D for trails and simple drawing
- PixiJS only for specialised particle-heavy sensory scenes where justified
- Rive runtime adapter for future/approved character state-machine files
- Howler.js or a thin Web Audio service for user-triggered audio
- Vitest
- Playwright
- GitHub Actions Pages build
- local/offline-first progress

Pin dependencies.
Bundle core dependencies.
Do not rely on third-party CDNs for essential gameplay.

==================================================
DIRECTORY TARGET
==================================================

Create a structure equivalent to:

/src/app
/src/core
/src/engines
/src/games
/src/content
/public/assets
/tests/unit
/tests/interaction
/tests/visual
/tests/performance

Core services:

- router
- game registry
- game lifecycle
- event bus
- sensory settings
- input service
- audio service
- asset loader
- progress store
- performance monitor
- character adapter

==================================================
GAME MODULE CONTRACT
==================================================

Every game must implement:

preload(context)
mount(context, host)
start()
pause()
resume()
reset()
applySensorySettings(settings)
destroy()

Destroy must remove:

- listeners
- timers
- requestAnimationFrame loops
- observers
- audio
- temporary DOM
- textures/resources

Only one game renderer may be active at a time.

==================================================
GLOBAL SENSORY SETTINGS
==================================================

Implement one settings service with:

motion: full | gentle | off
sound: on | off
voice: on | off
haptics: on | off
confetti: on | off
contrast: normal | high
particles: low | medium | high
timer: on | off
hints: automatic | on-request | off

Requirements:

- no autoplay sound;
- no unexpected movement;
- no rapid flashing;
- motion-off stops decorative loops but preserves state changes;
- settings persist locally;
- every engine responds immediately;
- settings drawer does not permanently cover the game stage;
- one always-reachable stop/pause control.

==================================================
INPUT REQUIREMENTS
==================================================

Use Pointer Events for finger, mouse and pen.

Use pointer capture for drags.

Every drag interaction must also support one of:

- tap item, then tap target;
- arrow controls;
- increment/decrement controls;
- single-pointer alternative.

Important controls should target at least 44 × 44 CSS pixels.

==================================================
CHARACTER STATE CONTRACT
==================================================

One shared function owns:

0–19 empty
20–39 low
40–64 calm
65–89 happy
90–100 excited

Shared character state:

characterId
energy 0–100
energyState
emotion
action
direction
outfit
motionEnabled

No game may redefine thresholds.

Leon never becomes Battery Buddy.
Zaya never becomes Battery Buddy.
Exactly one primary character occupies the stage unless the game intentionally uses multiple characters.

Create a RiveCharacterAdapter interface now even if final .riv files are not yet available.

When no approved animated character exists:

- use a clearly declared temporary fallback;
- do not claim it is final;
- do not import from reference/contact-sheet folders.

==================================================
PROCEDURAL ART RULE
==================================================

The following must be live objects rather than screenshots:

- battery fill and empty/full state
- charging dock
- sliders and gauges
- bubbles
- trails
- breathing orb
- rain/weather particles
- shape pieces
- number lines
- clocks and calendars
- orbit paths
- balance scale

Use SVG, Canvas, Phaser or PixiJS as appropriate.

==================================================
MILESTONE 1 — BUILD ONLY THIS NOW
==================================================

Do not build all 30 games yet.

Build the V2 shell plus the first five flagship interaction proofs:

1. MY ENERGY BATTERY LAB

- Pure SVG/procedural battery.
- Continuously drains/fills from 0–100.
- Face, posture, colour, glow and label respond.
- One shared canonical state mapping.
- Touch slider plus +/- alternatives.
- Motion off preserves the state without bounce.
- No raster battery screenshot.

2. DASH TO THE CHARGING DOCK

- Position and energy are separate variables.
- New round starts at position 0 and energy 0.
- Travelling does not charge.
- Dock contact triggers:
  empty → low → calm → happy → excited.
- Reset returns position and energy to zero.
- Use procedural battery or approved animated character adapter.
- Buttons provide an alternative to dragging.

3. QUIET BUBBLE GARDEN

- Canvas/Pixi particle engine.
- Stable pointer interaction.
- Object pooling.
- User-adjustable density and speed.
- Calm mode uses fewer/slower bubbles.
- No timer.
- Optional user-triggered pop sound.

4. FINGER LIGHT TRAIL

- High-DPI Canvas.
- Pointer Events and pointer capture.
- Smoothed strokes.
- Clear/reset.
- Colour and thickness choices.
- No score or timer.
- Prevent page scrolling only inside the drawing surface.

5. HOLD TO BREATHE

- SVG/WAAPI or requestAnimationFrame.
- Starts only when pressed.
- Hold expands; release settles.
- Can stop immediately.
- Motion-off uses a simple progress change.
- No clinical claim.

==================================================
WORLD HOMEPAGE AND SHELL
==================================================

Create a short V2 homepage with these world cards:

- Sensory & Regulation
- Maths & Logic
- Literacy
- Time, World & Life
- My Characters & Rewards

For Milestone 1, only the five flagship games are live.
Other cards may show clearly labelled planned status without fake links.

Each game route uses the same shell:

Home
Back
Title
One-sentence instruction
Repeat instruction if relevant
Pause/settings
Game stage
Finished card
Repeat / Another Game / Home

Do not make the child scroll through unrelated activities during play.

==================================================
VISUAL DIRECTION
==================================================

Aim for a polished modern children’s game feel:

- consistent rounded shapes;
- one controlled palette;
- crisp SVG/Canvas art;
- depth used sparingly;
- stable layouts;
- large touch targets;
- readable type;
- no mixed random emoji/clip-art as primary art;
- no heavy permanent toolbar;
- no tiny character inside a huge empty stage;
- no page that looks like a settings form.

Do not copy another company’s trade dress.

==================================================
PERFORMANCE TARGETS
==================================================

Measure, do not guess.

On a 390 × 844 mobile viewport:

- ordinary interaction should target stable 60fps where practical;
- no recurring long tasks above 50ms during active play;
- one active renderer;
- no catalogue-wide preload;
- hidden routes stop rendering;
- particle counts are capped;
- all animation loops use delta time;
- no uncontrolled MutationObserver loops;
- assets are destroyed/unloaded on route exit.

==================================================
TESTS
==================================================

Add:

- unit tests for state mapping;
- game lifecycle cleanup tests;
- settings propagation tests;
- route/link tests;
- missing asset tests;
- runtime reference-folder prohibition tests;
- Playwright iPhone-sized interaction tests;
- drag-alternative tests;
- motion-off tests;
- sound-off tests;
- visual snapshots;
- basic frame/long-task performance instrumentation.

Mandatory Charging Dock test:

A. Start again.
Expected: position 0, energy 0, empty.

B. Move halfway.
Expected: position about 50, energy still 0.

C. Stop before dock.
Expected: energy still 0.

D. Reach dock.
Expected: charge begins.

E. Finish.
Expected: energy 100, excited/full.

F. Reset.
Expected: position 0, energy 0.

==================================================
CONTENT ROADMAP
==================================================

Load the 30 game specifications from:

05-machine-readable/games-v2.json

Do not build them now.

Create registry entries and planned routes so the architecture supports them.

The order after Milestone 1 is:

Milestone 2 — ten-game alpha
Milestone 3 — twenty-game family beta
Milestone 4 — thirty-game catalogue
Milestone 5 — games 31–60

Each later milestone is a separate Codex mission and approval gate.

==================================================
PROOF REQUIRED BEFORE STOPPING
==================================================

Return:

1. exact branch and head SHA;
2. files created/changed;
3. architecture summary;
4. dependency versions;
5. five working preview routes;
6. iPhone screenshots for each game;
7. short recordings/GIFs or frame sequences proving smooth interaction;
8. test results;
9. performance summary;
10. motion-off and sound-off proof;
11. Charging Dock state trace;
12. known limitations;
13. P0/P1 issues;
14. confirmation main/live was not changed.

STOP after Milestone 1.

Do not begin the remaining 25 games.
Do not merge.
Wait for visual and interaction approval.
```
