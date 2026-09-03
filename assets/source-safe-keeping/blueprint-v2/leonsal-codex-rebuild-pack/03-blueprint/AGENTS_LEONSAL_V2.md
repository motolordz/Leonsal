# LeonSal.com V2 — Root Product and Engineering Constitution

This file governs all LeonSal V2 product, design, content, character, sensory, game-engine, testing and deployment work.

No nested instruction, prompt, convenience shortcut or temporary implementation may weaken it.

## 1. Mission

Build LeonSal into a high-grade, child-led learning and sensory game universe that is smooth, predictable, joyful, mobile-first and especially usable by children who benefit from reduced stimulation, clear visual structure and multiple ways to interact.

LeonSal is not a therapy, diagnosis, assessment or medical device. It supports play, learning, communication, routine practice and self-directed sensory choices.

## 2. Quality can only move upward

- Do not lower standards to make a milestone look complete.
- Do not count placeholders, contact-sheet crops, static screenshots or unverified assets as production art.
- Do not count a button click as a completed game.
- Do not claim animation when the implementation merely moves or swaps a static image.
- Do not merge a regression because the new feature appears visually impressive.
- If source material cannot meet the quality floor, record it as needing regeneration.

## 3. Plan before build

Use:

```text
THINK → MODEL → CHALLENGE → BUILD → PROVE
```

Before implementation:

1. identify the child’s task;
2. identify the learning or sensory purpose;
3. choose the smallest suitable engine;
4. define state and events;
5. define motion-off and sound-off behaviour;
6. define mobile acceptance;
7. challenge whether the interaction is understandable without instructions;
8. then build.

## 4. Source-of-truth hierarchy

1. This constitution.
2. Approved game/engine specifications.
3. Approved character and asset registries.
4. Verified curriculum/factual content sources.
5. Accepted visual prototypes.
6. Existing code.
7. Temporary implementation notes.

Existing code is not authoritative merely because it already exists.

## 5. V2 must be built in parallel

- Keep the current live site stable while V2 is built.
- Use a dedicated branch such as `build/leonsal-v2-foundation`.
- Publish a preview without changing the live custom domain.
- Do not extend the current long single-page sensory prototype into the V2 architecture.
- Reuse sound content, game logic and assets only after they pass V2 standards.
- Cut over only after exact-head acceptance and user approval.

## 6. Experience architecture

### Homepage

The homepage is a short world hub, not a page containing every game and setting.

Required worlds:

- Sensory & Regulation
- Maths & Logic
- Literacy
- Time, World & Life
- My Characters & Rewards

### Game route

Each game has:

- Home;
- Back;
- title;
- one-sentence instruction;
- repeat instruction where needed;
- pause/settings;
- one fixed game stage;
- progress only when useful;
- a clear Finished state;
- Repeat / Another Game / Home.

Playing should not require a long vertical scroll.

### Predictable flow

Every game follows:

```text
Ready → Play → Finished → Next
```

## 7. Technology boundaries

### Shell and simple interactions

Use semantic HTML, CSS, SVG and Web Animations API.

### Structured 2D games

Use Phaser for scenes, cameras, asset loading, drag/drop, collision, physics and game lifecycle.

### High-density sensory particles

Use PixiJS only when a specialised particle renderer is justified. Do not combine Phaser and PixiJS in one game without a proven need.

### Recurring character animation

Use Rive state machines where possible. Accept a properly authored sprite atlas as a fallback. Five static PNG poses are not the final character-animation system.

### Audio

Use one shared Howler/Web Audio service. No game creates uncontrolled audio independently.

### Build system

Use Vite + TypeScript, Vitest, Playwright and a GitHub Actions Pages build.

Pin versions. Bundle runtime dependencies. Avoid third-party CDN dependency for core play.

## 8. Game-module contract

Every game supports:

```ts
preload(context)
mount(context, host)
start()
pause()
resume()
reset()
applySensorySettings(settings)
destroy()
```

On destroy, the game must remove:

- listeners;
- timers;
- animation frames;
- observers;
- audio;
- textures/resources;
- temporary DOM.

Only one game renderer is active at a time.

## 9. Reusable-engine rule

Do not hand-code 30 unrelated pages.

Build and reuse the engines defined in `LEONSAL_12_REUSABLE_ENGINES.md`:

1. Character State & Animation
2. Procedural Energy/Battery
3. Particle & Ambient Sensory
4. Trail, Tracing & Drawing
5. Drag, Tap & Snap
6. Sort, Match & Categorise
7. Memory Card
8. Sequence, Calendar & Routine
9. Gentle Physics & Balance
10. Audio, Rhythm & Phonics
11. Breathing & Pacing
12. World Hub, Game Shell & Progress

A new game should mostly provide content, configuration and scene rules—not duplicate core infrastructure.

## 10. Character constitution

### Principal characters

Leon and Zaya are siblings and principal LeonSal guides.

Their identity remains stable across all games:

- consistent face;
- hair;
- skin tone;
- proportions;
- naming;
- art direction.

Do not mirror name-bearing clothing. Do not create a visually different Leon or Zaya without approval.

### Character state

One shared state model owns:

```text
characterId
energy 0–100
energyState
emotion
action
direction
outfit
motionEnabled
```

Canonical energy ranges:

- 0–19 `empty`
- 20–39 `low`
- 40–64 `calm`
- 65–89 `happy`
- 90–100 `excited`

No game may redefine these thresholds.

### Required actions

Recurring characters should support:

- idle;
- sleep;
- wake;
- walk/run;
- point;
- think;
- celebrate;
- calm-breathe.

### Identity isolation

- Leon never renders Battery Buddy.
- Zaya never renders Battery Buddy.
- A selected character never inherits another character’s image or state.
- Exactly one primary character renderer occupies a stage unless the game deliberately contains multiple characters.

## 11. Asset constitution

### Reference-only material

Posters, contact sheets, birthday art, character grids, screenshots and concept boards are references only.

Runtime code must never import from:

```text
reference-only/
source-safe-keeping/
rejected/
contact-sheets/
qa/
```

### Production art

Preferred character format:

- Rive `.riv` state-machine file.

Fallback:

- transparent, properly authored sprite atlas and frame map.

Static transparent PNG:

- acceptable for cards, thumbnails and temporary key-pose fallback;
- not accepted as proof of smooth animation.

### Production raster requirements

- one subject;
- no poster cell or label;
- true alpha;
- complete body/effect;
- safe padding;
- no enlargement of tiny source crops;
- coherent scale and lighting;
- PNG master preserved;
- optimised derivative generated separately.

### Procedural objects

Batteries, clocks, calendars, bubbles, rain, trails, shape pieces, orbits, number lines and gauges should be live SVG/Canvas/WebGL objects—not screenshots.

## 12. Sensory and autism-friendly design

Sensory needs vary by child. Do not create one compulsory autism profile.

Global settings:

```text
motion: full | gentle | off
sound: on | off
voice: on | off
haptics: on | off
confetti: on | off
contrast: normal | high
particles: low | medium | high
timer: on | off
hints: automatic | on-request | off
```

Requirements:

- no unexpected sound;
- no rapid flashing;
- no surprise context changes;
- no decorative motion that cannot be stopped;
- no shame/punishment for low energy or incorrect attempts;
- stable control positions;
- short instructions;
- predictable transitions;
- child may stop, repeat or switch;
- state remains understandable with all sensory effects disabled.

## 13. Input and motor access

- Use Pointer Events for finger, mouse and pen.
- Use pointer capture for drags.
- Scope `touch-action` to the active interaction region.
- Every dragging function has a tap/button alternative unless dragging is essential.
- Important controls aim for at least 44 × 44 CSS pixels.
- Sliders include large thumb controls and increment/decrement alternatives when precision matters.
- Do not place essential controls at unsafe screen edges.

## 14. Audio and voice

- no autoplay;
- user action required before audio;
- master mute and stop-all;
- visual equivalent for meaningful sound;
- repeat prompt control;
- no robotic low-quality voice presented as finished production;
- Australian-English learning content is human reviewed;
- music off by default in calm/sensory mode.

## 15. Educational integrity

- Every game declares a learning goal.
- Difficulty progression is explicit.
- Facts are verified against authoritative sources.
- Literacy sound mappings are human reviewed.
- Space facts identify the Sun as a star and Pluto as a dwarf planet where used.
- Not-to-scale visualisations are labelled.
- The game supports teaching; it does not falsely claim to replace a teacher or therapist.

## 16. Child safety and privacy

Initial release:

- no ads;
- no external behavioural tracking;
- no child profiling;
- no public chat;
- no user-upload sharing;
- no location collection;
- no personal data required to play;
- local progress by default;
- grown-up-only settings clearly separated where appropriate.

## 17. Performance constitution

Project acceptance targets on current iPhone Safari:

- smooth interaction, ordinarily targeting 60fps;
- no recurring long tasks above 50ms during play;
- one active renderer;
- per-game lazy loading;
- no homepage preload of the entire catalogue;
- bounded particles and physics;
- rendering pauses when hidden;
- assets released on destroy;
- no layout thrash in frame loops;
- no uncontrolled DOM mutation observers.

Do not claim a target was met without measurement.

## 18. Testing constitution

Required:

- unit tests;
- schemas/registries;
- route and asset verification;
- runtime-reference prohibition tests;
- mobile Playwright tests;
- visual snapshots;
- motion-off tests;
- sound-off tests;
- drag-alternative tests;
- game lifecycle cleanup tests;
- performance checks;
- exact-head deployment proof.

Manual review includes actual iPhone screenshots and short recordings for animation-heavy games.

## 19. Release milestones

### Milestone 0 — audit and freeze

- catalogue current routes/assets;
- preserve live;
- document regressions;
- establish V2 branch.

### Milestone 1 — shell + five engine proofs

- world homepage;
- game shell;
- sensory settings;
- Energy Battery Lab;
- Charging Dock Dash;
- Quiet Bubble Garden;
- Finger Light Trail;
- Hold to Breathe.

Stop for visual/mobile approval.

### Milestone 2 — ten-game alpha

Add:

- Calm Colour Flow;
- Rainmaker Window;
- Shape Snap Builder;
- Number Merge Playground;
- Alphabet Adventure.

### Milestone 3 — twenty-game family beta

Add the next ten from `LEONSAL_FIRST_30_GAMES.md`.

### Milestone 4 — thirty-game catalogue

Complete the first 30 and prove navigation, performance and content consistency.

### Milestone 5 — 31–60

Only after the first 30 are accepted.

## 20. Live deployment authority

- Production confirms accepted work; it is not the first realistic test.
- Do not merge or deploy merely to inspect a feature.
- Preview exact head first.
- No DNS/CNAME changes in feature work.
- No live cutover without explicit user approval.
- If a P0/P1 exists, stop and report it.

## 21. Completion language

Never say “done”, “production-ready”, “HD”, “transparent”, “smooth” or “implemented” without evidence matching that word.

A PNG extension does not prove transparency.
A file existence check does not prove visual quality.
An image moving across a screen does not prove animation quality.
A button responding does not prove a game is complete.
