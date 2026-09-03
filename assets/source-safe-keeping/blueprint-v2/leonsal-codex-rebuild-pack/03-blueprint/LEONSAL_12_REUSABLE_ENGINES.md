# LeonSal V2 — Twelve Reusable Interactive Engines

The goal is not to hand-code 30 unrelated pages. Build twelve small, tested engines and use configuration data to produce many games.

## 1. Character State & Animation Engine

**Purpose:** One runtime for Leon, Zaya, alphabet, number and world characters.

**Best format:** Rive state machines. Temporary fallback: properly authored sprite atlas.

**Inputs:** character ID, energy 0–100, emotion, action, direction, outfit, motion setting.

**Outputs:** visible animation, accessible description and character events.

**Required actions:** idle, sleep, wake, walk/run, point, think, celebrate and calm-breathe.

**Key rule:** The character remains the same identity. Leon never becomes Battery Buddy; Zaya never inherits another sprite.

## 2. Procedural Energy/Battery Engine

**Purpose:** Batteries, energy bars, charging, draining and cause-and-effect.

**Technology:** SVG masks and paths, Web Animations API and `requestAnimationFrame`.

**State:** `position` and `energy` are separate. Travelling never charges by itself. Dock contact emits `charge-start` and then energy increases.

**Use:** Energy Battery Lab, Charging Dock Dash, breathing rewards and device-power games.

## 3. Particle & Ambient Sensory Engine

**Purpose:** Bubbles, rain, stars, fireflies, snow, leaves, sparkles and colour flow.

**Technology:** PixiJS/WebGL or Canvas fallback with object pools.

**Controls:** speed, density, size, sound and calm mode.

**Safety:** No strobe effects, bounded brightness, no uncontrolled particle explosions.

## 4. Trail, Tracing & Drawing Engine

**Purpose:** Finger trails, letter tracing, shape tracing and free drawing.

**Technology:** high-DPI Canvas 2D and Pointer Events.

**Features:** path smoothing, optional glow, guide paths, tolerance bands, undo/clear and local save.

**Use:** Light Trail, Trace the Letter, shape drawing and creative games.

## 5. Drag, Tap & Snap Engine

**Purpose:** Move objects into targets without requiring precise dragging.

**Inputs:** item, target, snap tolerance, assist level and placement rules.

**Accessibility:** Every drag interaction has a tap-item-then-tap-target or arrow-button alternative.

**Use:** Shape Builder, Day Train, Month Wheel, Planet Parade, routines and sorting.

## 6. Sort, Match & Categorise Engine

**Purpose:** Reusable rounds for matching sounds, shapes, colours, numbers, animals, habitats, seasons and planets.

**Configuration:** item set, category set, distractor count, prompt type and difficulty.

**Feedback:** gentle correction, optional hint, no harsh red failure screen.

## 7. Memory Card Engine

**Purpose:** Pairs and short visual recall.

**Configuration:** board size, preview, theme, animation amount and no-timer mode.

**Use:** Memory Garden, letter pairs, number pairs, planet pairs and emotions.

## 8. Sequence, Calendar & Routine Engine

**Purpose:** Before/after, first-then-finished, days, months, story order and daily routines.

**Visual language:** stable slots, a visible finished area and a clear next step.

**Use:** Routine Builder, Day Train, Month Wheel and Story Sequence.

## 9. Gentle Physics & Balance Engine

**Purpose:** stacking, rolling, catching, seesaws, ramps and number blocks.

**Technology:** Phaser Arcade or Matter physics with fixed/bounded timestep.

**Sensory defaults:** slow motion, damping, no camera shake and immediate reset.

## 10. Audio, Rhythm & Phonics Engine

**Purpose:** consistent, user-triggered audio across all games.

**Technology:** Howler.js/Web Audio, audio sprites and a shared voice registry.

**Requirements:** no autoplay, stop-all control, master volume, repeat instruction and visible equivalent for meaningful sounds.

## 11. Breathing & Pacing Engine

**Purpose:** child-controlled expand/settle interactions.

**Technology:** SVG and Web Animations API.

**Rule:** Never starts automatically, never traps the child in a timed sequence and never claims to diagnose or treat a condition.

## 12. World Hub, Game Shell & Progress Engine

**Purpose:** routes, loading, lifecycle, settings, local progress, badges, Home/Back and performance cleanup.

**Rule:** One game module mounted at a time. When a game closes, timers, audio, animation frames and textures are destroyed.

---

# Standard engine lifecycle

Every engine and game follows:

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

# Standard event vocabulary

Use shared events rather than direct cross-file DOM manipulation:

```text
game-ready
game-start
game-pause
game-reset
game-complete
character-change
energy-change
dock-enter
charge-start
charge-progress
charge-complete
correct-answer
gentle-retry
hint-request
settings-change
```

# Engine selection rule

- Use semantic DOM/SVG for buttons, instructions and simple gauges.
- Use Phaser for structured games and physics.
- Use PixiJS for particle-heavy sensory scenes only.
- Use Rive for recurring animated characters.
- Do not use screenshots or contact sheets as gameplay objects.
- Do not use a heavy renderer where a small SVG interaction will be clearer and faster.
