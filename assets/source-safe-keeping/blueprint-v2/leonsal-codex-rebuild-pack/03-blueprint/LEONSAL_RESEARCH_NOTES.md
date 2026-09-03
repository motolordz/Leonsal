# LeonSal V2 Research Notes

This document separates evidence-derived design requirements from product/engineering decisions.

## Evidence-derived requirements

### Sensory needs vary by child

Autism CRC research describes substantial variation in sensory responses among autistic children, including sensitivity, avoidance, under-responsiveness and sensory seeking. Environmental sensory quality can support or hinder participation, and the impact differs by individual.

**LeonSal implication:** Never create one compulsory “autism mode”. Provide adjustable motion, sound, particles, contrast, pace and input methods, and remember that preferences can change from day to day.

Sources:

- Autism CRC — *Exploring the sensory profiles of children on the autism spectrum using the Short Sensory Profile-2*.
- Autism CRC — *Parent-reported environmental factors and strategies to support home and community participation in children on the autism spectrum*.
- Autism CRC — *Sensory subtypes in children on the autism spectrum*.

### Participation and self-regulation are stronger goals than claiming sensory treatment

Autism CRC’s clinical reasoning material notes limited support for broad remedial sensory claims and recommends focusing on participation, accommodation, family-centred choices, self-regulation and universal design.

**LeonSal implication:** Games may help a child communicate preferences, practise routines and choose calming or active play, but the product must not claim to diagnose, measure or treat autism.

Source:

- Autism CRC — *Optimizing participation of children with autism spectrum disorder experiencing sensory challenges: Clinical reasoning framework*.

### Predictable visual structure supports transitions and task engagement

Autism CRC material on structured teaching and visual schedules reports improved on-task behaviour and support for task transitions.

**LeonSal implication:** Every game uses Ready → Play → Finished → Next, stable controls and a visible reset/exit.

Sources:

- Autism CRC — *Structured Teaching*.
- Autism CRC — *The use of visual schedules and work systems to increase the on-task behaviour of students on the autism spectrum in mainstream classrooms*.

### Motion, sound and unexpected change must be controllable

W3C guidance recommends visible controls for automatically moving or sounding content, preventing unexpected movement, and honouring `prefers-reduced-motion`. WCAG 2.2 also requires alternatives for dragging and minimum target sizing/spacing.

**LeonSal implication:** No autoplay sound, no surprise animation, motion-off must be real, drag alternatives are mandatory, and important controls should aim for 44 × 44 CSS pixels.

Sources:

- W3C WAI — *Designing for Web Accessibility*.
- W3C WAI — *Ensure Controls and Content Do Not Move Unexpectedly*.
- W3C WAI — *Let Users Control When the Content Moves or Changes*.
- W3C WAI — Technique C39 for `prefers-reduced-motion`.
- WCAG 2.2 — Dragging Movements and Target Size.

## Engineering evidence

### Browser-synchronised animation

MDN recommends `requestAnimationFrame()` for smooth and efficient visual updates, rather than fixed timer loops. The Web Animations API allows the browser to optimise many animations internally.

**LeonSal implication:** Continuous game loops use `requestAnimationFrame` and delta time. DOM animation uses Web Animations API or compositor-friendly transforms where practical.

Sources:

- MDN — *Basic animations*.
- MDN — *Using the Web Animations API*.

### Pointer Events provide one input model

MDN’s Pointer Events guidance supports finger, mouse and pen through the same event model and uses `touch-action` to avoid browser gesture conflicts where appropriate.

**LeonSal implication:** Use Pointer Events, pointer capture and carefully scoped `touch-action`; do not maintain separate mouse and touch implementations.

Source:

- MDN — *Using Pointer Events*.

### Phaser is suited to structured browser games

Phaser’s official documentation describes a maintained 2D HTML5 game framework with WebGL/Canvas rendering for desktop and mobile browsers.

**LeonSal implication:** Use Phaser for scenes, assets, physics, collisions, cameras, drag/drop and structured mini-games rather than writing every game loop from scratch.

Source:

- Phaser official documentation and repository.

### PixiJS is suited to high-performance 2D sensory rendering

PixiJS describes itself as a high-performance 2D WebGPU/WebGL renderer. Its performance guidance recommends spritesheets, batching, culling and careful particle use.

**LeonSal implication:** Use PixiJS selectively for particle-heavy ambient sensory scenes, with strict object caps and fallback behaviour. Do not introduce a second renderer where Phaser or SVG is already sufficient.

Sources:

- PixiJS official site and renderer documentation.
- PixiJS performance tips.

### Rive supports interactive state-machine animation

Rive’s web runtime supports state machines, programmatic inputs, play/pause and settling when no further animation work is needed.

**LeonSal implication:** Rive is the preferred long-term character runtime for Leon, Zaya and recurring mascots. It can smoothly blend energy, emotion and action rather than swapping five flattened images.

Source:

- Rive official state-machine runtime documentation.

### Howler/Web Audio supports controlled cross-browser sound

Howler provides a consistent API, audio sprites, caching and fallback between Web Audio and HTML5 audio.

**LeonSal implication:** Use one shared audio service with no autoplay, master mute, stop-all and user-triggered voice/sound effects.

Source:

- Howler.js official documentation.

## Product/engineering decisions derived from the evidence

The following are LeonSal decisions rather than claims made directly by the sources:

1. Build V2 in parallel instead of continuing to expand the current long single-page prototype.
2. Use a hybrid renderer: semantic DOM/SVG for shell and simple interactions, Phaser for full games, Rive for characters and PixiJS only for specialised particle scenes.
3. Build twelve reusable engines before attempting 30 games.
4. Release games in batches of five with mobile screenshots and performance proof.
5. Keep progress local-only during the initial family testing phase.
6. Make procedural objects such as batteries and clocks live SVG/Canvas objects rather than image files.
