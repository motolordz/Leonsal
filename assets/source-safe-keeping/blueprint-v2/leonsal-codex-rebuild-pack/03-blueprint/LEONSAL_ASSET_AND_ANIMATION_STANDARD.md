# LeonSal V2 Asset and Animation Standard

## 1. Reference art is not runtime art

The uploaded posters, character grids, birthday images, banners and state charts are visual references. They may guide identity, colour, clothing and pose, but they must not be displayed directly inside a game.

A production asset contains exactly one intended subject and no:

- chart border;
- percentage badge;
- state label;
- neighbouring pose;
- neighbouring character;
- white/grey poster rectangle;
- screenshot chrome;
- prompt text.

## 2. Character hierarchy

### Preferred production format

A Rive `.riv` file with named artboards, state-machine inputs and accessible fallback art.

### Acceptable animated fallback

A sprite atlas with real animation frames and a JSON frame map.

### Temporary fallback

One transparent PNG per key pose. This is not considered the final animation system.

## 3. Character identity

Leon and Zaya must remain visually consistent across all games.

- names on clothing must not be mirrored or misspelled;
- hair, face, skin tone and proportions remain stable;
- energy changes can change pose, expression, outfit treatment and action without creating a different child;
- one approved character model sheet is the canonical identity reference.

## 4. Character state machine

Each recurring character supports:

```text
energy: 0–100
energyState: empty | low | calm | happy | excited
emotion: neutral | happy | sad | worried | frustrated | proud | surprised
activity: idle | sleep | wake | walk | run | point | think | celebrate | breathe
outfit: canonical outfit ID
motionEnabled: boolean
```

Energy is continuous. The five labels are semantic ranges, not five disconnected pictures.

## 5. Procedural game art

Use SVG, Canvas or WebGL for concepts that should react continuously:

- battery fill and terminals;
- progress bars;
- bubbles;
- light trails;
- weather;
- stars and particles;
- shape pieces;
- clocks;
- calendars;
- number lines;
- orbit paths;
- balance scales;
- water, rain and wind.

A screenshot of a battery is never an interactive battery.

## 6. Raster asset requirements

When a raster image is necessary:

- master PNG uses genuine RGBA transparency;
- transparent pixels exist around the subject;
- all corners are transparent unless the design intentionally fills the canvas;
- safe padding is 6–12% of the canvas;
- no body part touches the canvas edge;
- no forced enlargement of a tiny crop;
- main-stage art should generally have at least 1024 pixels on the longest side;
- use WebP/AVIF delivery derivatives only after inspecting alpha and edge quality;
- preserve the PNG master.

## 7. Vector and Rive requirements

- named layers and artboards;
- stable origin/pivot points;
- no text converted incorrectly or mirrored;
- animation transitions are blendable;
- state machine settles when idle;
- pause input stops decorative motion immediately;
- reduced-motion mode has a meaningful static pose;
- export fallback poster frame for unsupported environments.

## 8. Animation quality

### Target behaviour

- input response within the next animation frame;
- position updates use delta time;
- no abrupt canvas resize during play;
- no repeated layout measurement inside the frame loop;
- DOM motion uses `transform` and `opacity` where practical;
- particle systems use object pools;
- physics uses bounded/fixed steps;
- hidden games stop rendering.

### Motion language

Animations should feel soft, readable and intentional:

- ease-out for arrival;
- ease-in-out for breathing and floating;
- spring only for deliberate playful feedback;
- no constant wobbling of every object;
- no camera shake by default;
- no rapid scale pulsing.

## 9. Sound and haptics

- no autoplay;
- sound starts only after a deliberate user action;
- global mute and stop-all controls;
- volume limited to a safe product default;
- haptics are optional and never required to understand the game;
- every phonics/voice clip has a repeat button;
- music is off by default in sensory mode.

## 10. Art consistency gate

A family is not approved until its members share:

- line/edge treatment;
- lighting direction;
- colour saturation range;
- eye and face language;
- hand/foot style;
- shadow treatment;
- canvas scale;
- outline quality.

Do not mix glossy 3D, flat clip-art, emoji and photorealistic styles within one game scene.

## 11. Visual verification

Generate review-only sheets on checkerboard and dark/light backgrounds. Verify at:

- native size;
- 1× mobile size;
- 2× retina size;
- 390 × 844 viewport;
- tablet landscape;
- desktop.

Inspect:

- halos;
- missing white details;
- clipped limbs;
- jagged edges;
- unwanted labels;
- duplicated characters;
- inconsistent scale;
- blurred enlargement.

## 12. Runtime prohibition

Runtime code must never import from:

```text
reference-only/
source-safe-keeping/
rejected/
contact-sheets/
qa/
```

Build and tests fail if a production registry points into those folders.
