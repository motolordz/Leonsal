# Prototype: Smooth Sensory Engine Showcase

Open `sensory-engine-showcase.html` in a browser.

It is a standalone reference implementation containing five small engines:

1. Procedural SVG Energy Battery and Charging Dock
2. Canvas Bubble Particle Engine
3. Canvas Finger Light Trail
4. Child-controlled Breathing Orb
5. Drag-or-Tap Shape Snap

The prototype intentionally uses no external libraries so Codex can see the core interaction patterns clearly. The production V2 may move structured games to Phaser, character animation to Rive and particle-heavy scenes to PixiJS.

Important Charging Dock behaviour demonstrated:

- position and energy are separate;
- the battery starts at 0%;
- travel does not charge;
- dock contact starts charging;
- reset returns both values to zero.
