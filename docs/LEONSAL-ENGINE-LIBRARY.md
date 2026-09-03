# LeonSal Interaction Engine Library

The V2 proof work is formalised as a shared library. Games compose these engines rather than duplicating one-off interaction code.

## input - Input Engine
- Capabilities: Pointer/touch/mouse/pen capture; drag; tap; hold
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## motion-spring - Motion/Spring Engine
- Capabilities: rAF loop; delta time; easing; spring interpolation
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: hold-to-breathe
## state-machine - State Machine Engine
- Capabilities: Explicit state machines and canonical energy states
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## sensory-settings - Sensory Settings Engine
- Capabilities: Motion; sound; vibration; calm mode; particles; reduced motion
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## audio - Audio Engine
- Capabilities: User-triggered tones; mute; stop; repeat-ready playback
- Input modes: tap
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## particle - Particle Engine
- Capabilities: Bounded bubbles; stars; sparkles; rain; fireflies
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 80.
- Templates: quiet-bubble-garden, firefly-catch, snow-globe, star-shower
## trail-drawing - Trail/Drawing Engine
- Capabilities: High-DPI touch trails; interpolation; fading tails
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: finger-light-trail
## gauge-fill - Gauge/Fill Engine
- Capabilities: Continuous 0-100 fills; SVG gauges; battery states
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: my-energy-battery
## drag-snap - Drag/Snap Engine
- Capabilities: Snapping; drop zones; callbacks; tap alternative
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: number-merge
## reward - Reward Engine
- Capabilities: Stars; badges; calm celebrations; completion reactions
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## trace - Trace Engine
- Capabilities: Path; letter; number; shape; road tracing with tolerance
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: letter-tracing, number-tracing, shape-tracing
## sort-match - Sort/Match Engine
- Capabilities: Category; colour; shape; object matching with tap or drag
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: colour-match, big-small, sort-it, animal-habitats
## sequence - Sequence Engine
- Capabilities: First/next/last; routines; days; story order
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: alphabet-adventure, pattern-builder, days-week, months-year, transport-adventure
## orbit - Orbit Engine
- Capabilities: Circular/orbital motion; drag-to-orbit; speed scaling
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: planet-pals
## build-assembly - Build/Assembly Engine
- Capabilities: Shapes into pictures; puzzles; snap points
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: shape-builder, build-solar-system
## rhythm - Rhythm Engine
- Capabilities: Tap pulse; repeat pattern; visual beat; optional sound
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## balance-tilt - Balance/Tilt Engine
- Capabilities: Pointer-first balancing; optional device orientation
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: available for future templates
## cause-effect - Cause-and-Effect Engine
- Capabilities: Switches; levers; charge activation; transformations
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: dash-to-charging-dock, growing-garden, weather-world
## time-cycle - Time/Cycle Engine
- Capabilities: Day/night; clock; weekdays; months; seasons; timelines
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 0.
- Templates: day-night, seasons, first-clock
## calm-world - Calm World Engine
- Capabilities: Ambient rain; clouds; aquarium; stars; breathing scenes
- Input modes: touch, mouse, pen
- Sensory support: reduced-motion, calm-mode, sound-off, vibration-off, cleanup
- Performance budget: 60 FPS at 390x844; max particles 80.
- Templates: calm-rain-window

All engines must expose cleanup/pause paths, respect shared sensory settings, and work at 390x844, tablet, and desktop sizes.
