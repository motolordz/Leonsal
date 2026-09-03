# LeonSal V2 Acceptance Gates

A feature is not complete because it renders once. It is complete only when the interaction, sensory controls, performance, content and mobile presentation are proven.

## Gate 1 — Route and shell

- Direct route returns successfully.
- Home and Back work.
- Refreshing the route does not produce a 404.
- One game is mounted at a time.
- The stage is not obscured by the header, settings drawer or iPhone safe areas.
- Game destruction removes event listeners, timers, audio and animation frames.

## Gate 2 — Interaction

- Finger, mouse and keyboard/tap alternative work.
- Dragging is never the only method unless genuinely essential.
- Important targets aim for 44 × 44 CSS pixels or larger.
- Pointer capture is used for canvas/drag interactions.
- Reset returns every value to the declared initial state.
- Rapid repeated taps do not duplicate rounds or animations.

## Gate 3 — Sensory controls

Test every game with:

- motion full;
- motion gentle;
- motion off;
- sound on;
- sound off;
- haptics off;
- confetti off;
- high contrast;
- calm particles;
- no timer.

The learning state remains understandable when every optional effect is disabled.

## Gate 4 — Visual quality

- No screenshot, chart or contact sheet appears at runtime.
- No opaque rectangle around a supposed transparent character.
- No character overlap.
- No incorrect character fallback.
- No clipped head, hand, foot, wing, wheel or effect.
- No blurry enlargement.
- One coherent art style per scene.
- State transitions do not move the surrounding layout.

## Gate 5 — Animation and performance

Test on a current iPhone-sized viewport and a lower-power mobile profile.

- Input response appears within the next frame under ordinary load.
- Ordinary game play targets a stable 60fps where practical.
- No recurring long tasks above 50ms during active play.
- No animation loop continues after leaving the route.
- Particle count is capped.
- Hidden tabs pause rendering.
- Asset loading does not block the entire page.
- The homepage does not preload all game assets.

## Gate 6 — Character state

For every active character:

- identity is correct;
- `energy` maps through the one shared state function;
- 0–19 empty;
- 20–39 low;
- 40–64 calm;
- 65–89 happy;
- 90–100 excited;
- text, voice, animation and accessibility description agree;
- motion-off preserves the correct state;
- changing characters preserves the declared energy value;
- no Battery Buddy fallback appears behind Leon or Zaya.

## Gate 7 — Content and learning integrity

- The learning objective is explicit.
- Instructions are short and child-readable.
- Facts are verified against an authoritative source.
- Wrong answers receive a gentle retry, not punishment.
- Difficulty changes one or two variables at a time.
- A parent/teacher can understand what the game practises.
- The game does not claim clinical diagnosis or treatment.

## Gate 8 — Automated tests

Required before merge:

```text
unit tests
registry/schema tests
internal route/link tests
missing-asset tests
runtime-reference prohibition tests
Playwright mobile interaction tests
visual snapshot tests
reduced-motion tests
sound-off tests
game lifecycle cleanup tests
```

## Gate 9 — Manual child-flow review

For each flagship game, an adult tester should be able to answer yes to:

- Is it obvious where to begin?
- Is there only one main task?
- Can the child stop immediately?
- Is success clear?
- Is the next choice clear?
- Are mistakes safe and calm?
- Does the page avoid unexpected movement and sound?
- Can the game be completed without reading?
- Can it be completed without audio?
- Can it be completed without precise dragging?

## Gate 10 — Release evidence

The final report must include:

- exact commit SHA;
- build/check results;
- route list;
- mobile screenshots;
- short interaction recordings for animation-heavy games;
- frame/performance summary;
- asset manifest;
- known limitations;
- P0/P1 list;
- confirmation that live was not changed before approval.
