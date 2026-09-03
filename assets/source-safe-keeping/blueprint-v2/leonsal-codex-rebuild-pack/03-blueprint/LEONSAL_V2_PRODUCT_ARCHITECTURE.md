# LeonSal V2 Product and Technical Architecture

## Product direction

LeonSal V2 is a connected learning-and-sensory game universe for children, especially children who benefit from predictable structure, clear choices, reduced stimulation and multiple ways to interact.

It is not a medical treatment, assessment or diagnostic tool. It is a child-led play and learning platform with sensory-friendly controls.

## Experience model

### Home

The homepage should be short and visual. It should show five world cards rather than every control and activity on one page:

1. Sensory & Regulation
2. Maths & Logic
3. Literacy
4. Time, World & Life
5. My Characters & Rewards

Each world opens a small game map. A child sees only a manageable number of choices at once.

### Game shell

Every game route uses the same shell:

- Home
- Back
- game title
- one-sentence instruction
- sound repeat button when needed
- pause/settings button
- fixed game stage
- optional progress indicator
- finish card

The game stage should normally fit inside one mobile viewport. Supporting text and parent notes can sit outside the play route or behind a grown-up control.

### Predictable sequence

Each game follows:

1. **Ready** — what to do.
2. **Play** — one active task.
3. **Finished** — clear completion.
4. **Next** — repeat, choose another or return home.

## Recommended technology stack

### App and build system

- Vite
- TypeScript
- semantic HTML/CSS for the shell
- Vitest for unit tests
- Playwright for browser and mobile interaction tests
- Workbox or a small service worker for offline caching
- GitHub Actions for build, tests and GitHub Pages deployment

Pin dependency versions. Do not load core game libraries from third-party CDNs at runtime.

### Game renderer

Use **Phaser** for structured 2D mini-games that need scenes, asset loading, collision, drag/drop, particles, cameras or physics.

Use **native SVG/DOM/Web Animations API** for accessible controls and simple procedural interactive objects such as batteries, clocks, calendars, gauges and sliders.

Use **PixiJS only for specialised high-density sensory particle scenes** where a lightweight renderer is preferable. Do not place a Pixi and Phaser renderer in the same game unless there is a proven need.

### Character animation

Use **Rive state machines** for Leon, Zaya and recurring mascot characters where possible. A character file should expose inputs such as:

- `energy` 0–100
- `emotion`
- `action`
- `direction`
- `outfit`
- `celebrate`
- `motionEnabled`

A Rive state machine can settle when idle, which avoids unnecessary animation work. When Rive authoring is not yet available, use a properly authored sprite atlas with real animation frames. Five static PNG poses remain fallback only.

### Audio

Use Howler.js or a thin Web Audio service for:

- user-triggered sound effects;
- phonics and voice clips;
- volume and mute control;
- audio sprites;
- global stop;
- no autoplay.

All meaningful audio must have a visual/text equivalent.

## Repository structure

```text
/
  AGENTS.md
  package.json
  vite.config.ts
  tsconfig.json
  index.html

/src/
  app/
    router.ts
    game-registry.ts
    shell/
    worlds/

  core/
    event-bus.ts
    game-lifecycle.ts
    sensory-settings.ts
    progress-store.ts
    asset-loader.ts
    audio-service.ts
    input-service.ts
    performance-monitor.ts

  engines/
    character/
    energy/
    particles/
    trail/
    drag-snap/
    sort-match/
    memory/
    sequence/
    physics/
    breathing/

  games/
    energy-battery-lab/
    charging-dock-dash/
    bubble-garden/
    light-trail/
    breathing-orb/
    ...

  content/
    games.json
    characters.json
    curriculum.json
    voice-lines.json

/public/
  assets/
    characters/
      rive/
      atlases/
      reference-only/
    audio/
    backgrounds/
    icons/

/tests/
  unit/
  interaction/
  visual/
  performance/
```

## Game-module contract

Every game exports the same lifecycle:

```ts
export interface LeonSalGame {
  id: string;
  preload(context: GameContext): Promise<void>;
  mount(context: GameContext, host: HTMLElement): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  applySensorySettings(settings: SensorySettings): void;
  destroy(): void;
}
```

Games must remove listeners, animation frames, timers and audio when destroyed.

## Shared state

### Sensory settings

```ts
interface SensorySettings {
  motion: 'full' | 'gentle' | 'off';
  sound: boolean;
  voice: boolean;
  haptics: boolean;
  confetti: boolean;
  contrast: 'normal' | 'high';
  particles: 'low' | 'medium' | 'high';
  timer: boolean;
  hints: 'automatic' | 'on-request' | 'off';
}
```

Defaults should be calm and non-surprising. Settings persist locally and are applied by every engine.

### Character state

```ts
interface CharacterState {
  characterId: string;
  energy: number;
  energyState: 'empty' | 'low' | 'calm' | 'happy' | 'excited';
  emotion?: string;
  action?: string;
  outfit?: string;
}
```

Canonical energy thresholds:

- 0–19 empty
- 20–39 low
- 40–64 calm
- 65–89 happy
- 90–100 excited

One shared function owns this mapping. No game duplicates it.

## Input model

Use Pointer Events so the same code supports finger, mouse and pen.

- Canvas/game stages use appropriate `touch-action` rules.
- Pointer capture preserves a drag when the finger moves outside an object.
- Every drag has a single-tap or button alternative.
- Important targets aim for at least 44 × 44 CSS pixels.
- Sliders also have increment/decrement buttons where precision may be difficult.

## Animation model

### Procedural objects

Batteries, gauges, bubbles, rain, clocks, number lines and shape pieces should be live objects, not pictures of objects.

Use:

- SVG attributes and masks;
- Canvas/WebGL drawing;
- Web Animations API;
- `requestAnimationFrame` with delta time;
- transforms and opacity for DOM motion;
- object pooling for particles;
- fixed or bounded physics steps.

### Character motion

Characters use named animation states such as:

- idle
- sleep
- wake
- walk
- run
- point
- think
- celebrate
- calm-breathe

Energy changes should blend into these actions rather than abruptly replacing an entire rectangle.

### Reduced motion

When motion is off:

- stop decorative loops;
- freeze particles or replace them with static equivalents;
- use short opacity changes instead of travel/bounce;
- preserve state, instruction and completion information;
- never hide functionality.

## Performance budgets

Project targets for a current iPhone in Safari:

- stable 60fps during ordinary play where practical;
- no recurring long tasks above 50ms during interaction;
- one active renderer per game route;
- no more than the current game’s assets preloaded;
- no full A–Z or 60-game asset library loaded on the homepage;
- use texture atlases for related sprites;
- cap particle counts by device tier and sensory setting;
- pause rendering when the page is hidden;
- release textures and audio on game destruction.

These are acceptance targets, not marketing claims.

## Asset pipeline

### Reference-only assets

Posters, contact sheets and concept boards live under:

```text
public/assets/reference-only/
```

They are never imported by runtime code.

### Production character assets

Preferred:

```text
public/assets/characters/rive/leon.riv
public/assets/characters/rive/zaya.riv
```

Fallback atlas:

```text
public/assets/characters/atlases/leon.webp
public/assets/characters/atlases/leon.json
```

Static transparent PNGs may be used for thumbnails, cards and temporary fallback poses, not as the long-term animation engine.

## Progress and privacy

Initial progress is local-only:

- recently played games;
- stars/badges;
- completed levels;
- sensory preferences;
- selected character.

Do not add external child analytics, advertising, behavioural profiling or personal data collection to the first release.

## Deployment strategy

1. Keep current live `main` stable.
2. Create `build/leonsal-v2-foundation`.
3. Publish a preview through a branch deployment or `/v2-preview/` path.
4. Build and accept the first five flagship interactions.
5. Migrate Games 1–3 into the shell.
6. Add games in batches of five.
7. Replace `main` only after exact-head tests, mobile screenshots and user approval.

## Why this architecture is different

The current prototype treats interaction as page scripts manipulating images. V2 treats each experience as a game module running inside a shared, testable engine platform. That is the difference between adding more pictures to a webpage and building a scalable children’s game product.
