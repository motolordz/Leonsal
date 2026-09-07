# LeonSal Interaction Engine Bible

This is the adopted Part B interaction-engine specification for LeonSal V2. It is subordinate to the root `AGENTS.md`; where rules differ, the root file and stronger child-safety/accessibility requirements win.

## Status

The current repository has twenty reusable V2 proof engines in `v2-engine.js` and `data/engines-v2.json`. Those first twenty engine IDs are preserved. The broader Part B contract is recorded in `data/engine-contracts-v2.json` as twenty-eight engine specifications: twenty existing implemented proofs and eight specification-only engines.

A specification is not a completed game. A game is not complete because an HTML page, random JavaScript, PNG, or CSS movement exists. Games must compose reusable engines, shared content/data, sensory settings, and approved assets.

## Architecture Order

1. Platform foundation
2. Reusable interaction engines
3. Game templates
4. Content and data
5. Worlds and themes
6. Characters
7. Child experience

Work must not reverse this into page-first one-off games.

## Required Engine Contract

Every engine must define an ID, capabilities, input modes, sensory settings, cleanup/pause path, supported templates, and performance budget. Engines must support touch first, then mouse and pen where relevant. Keyboard or tap alternatives are required when drag precision is not essential.

Every engine must respect: Motion, Sound, Particles, Speed, Vibration, Calm Mode, and Reduced Motion. A saved preset or game setting may request less intensity, but it must never exceed the current global preference ceiling.

## Current First-Twenty IDs

1. `input` - Input Engine
2. `motion-spring` - Motion/Spring Engine
3. `state-machine` - State Machine Engine
4. `sensory-settings` - Sensory Settings Engine
5. `audio` - Audio Engine
6. `particle` - Particle Engine
7. `trail-drawing` - Trail/Drawing Engine
8. `gauge-fill` - Gauge/Fill Engine
9. `drag-snap` - Drag/Snap Engine
10. `reward` - Reward Engine
11. `trace` - Trace Engine
12. `sort-match` - Sort/Match Engine
13. `sequence` - Sequence Engine
14. `orbit` - Orbit Engine
15. `build-assembly` - Build/Assembly Engine
16. `rhythm` - Rhythm Engine
17. `balance-tilt` - Balance/Tilt Engine
18. `cause-effect` - Cause-and-Effect Engine
19. `time-cycle` - Time/Cycle Engine
20. `calm-world` - Calm World Engine

## Additional Part B Specification-Only IDs

21. `memory-recall` - Memory/Recall Engine
22. `physics-play` - Physics Play Engine
23. `character-state-animation` - Character State Animation Engine
24. `world-shell-progress` - World Shell Progress Engine
25. `asset-loader` - Asset Loader Engine
26. `performance-monitor` - Performance Monitor Engine
27. `profile-progress-store` - Profile Progress Store Engine
28. `hint-feedback` - Hint/Feedback Engine

These eight additional records are architecture contracts only. They do not represent shipped engines or completed games.

## Runtime Asset Boundary

Engine code must use registries and must not load blocked runtime paths. Character art with `pending-art`, `review`, or `rejected` status cannot become a runtime image source. If approved art is unavailable, the game must use a clean procedural/fallback component without substituting another character.

## Open Runtime Work Items

`BAT-FACE-001` remains open. The Battery face needs visual correction before production acceptance.

`DASH-ENERGY-001` remains a required invariant: travel changes position only; energy stays 0 until dock contact; charging progresses to 100 after dock contact; Start Again resets position and energy.
