# LeonSal completion checkpoint — 11 September 2026

## Source of truth and current location

- Repository: `motolordz/Leonsal`.
- Permanent consolidated checkout: `/Users/mehdisalarzadeh/Documents/Codex/2026-09-10/hel/work/leonsal-recovery`.
- Branch: `fix/character-art-pipeline-v2`; integration began at `83a3b0ddd3ea47ade21d5fd93122a0b5cd456589`.
- Prior preview work from `build/leonsal-completion-20260910` is now incorporated here. The old preview checkout is no longer the working source.
- Central handoff and current imagery status: [LEONSAL_PROJECT_STATE.md](LEONSAL_PROJECT_STATE.md).
- The older 3 September projectless folder is an early scaffold, not the current Git source.
- Current implementation has five flagship V2 previews, three legacy learning routes, and 22 specified-only game entries. A route or passing safety check is not a completed release.
- Root `AGENTS.md`, `agent.md`, interaction/sensory Bibles, engine/game registries, and the preserved V2 blueprint supply requirements. This checklist does not replace or weaken them.

## Related tasks inspected

- “🧒🏻 LEONSAL.COM AGENT.MD”: latest recovery checkpoint, approval-preservation fixes, rejected Leon/Zaya method pilots; one approved character.
- “Build Character Production Library”: required artwork quality, targeted import, preservation and completeness gates; avoid repeating failed procedural artwork generation.
- “Math Game Upgrade”: conversation reports Leon/Zaya/Elephant/Lion five-pose sets generated and Monkey incomplete. Generated binary images were not exposed by the task reader. These claims have NOT been treated as source files or production approvals.
- “Interactive Sensory Features Plan”: shared character appearance and interaction requirements; work efficiently in small verified batches.

## Delivered in this continuation

- [x] Reconcile current source, remote branch, Markdown requirements and recent tasks.
- [x] Create `v2-home.html` with the five preview activities and clearly planned future worlds.
- [x] Add shared Home, Pause, Finished, resume and restart controls to the five flagship previews.
- [x] Pause rendering and audio on explicit pause and page hide; preserve elapsed charging time when resuming.
- [x] Prevent pointer events on scene buttons from activating the scene a second time.
- [x] Add keyboard bubble popping, arrow-key trail drawing, and keyboard Expand/Settle.
- [x] Preserve keyboard focus while toggling settings; close settings with Escape/outside tap.
- [x] Honour OS reduced motion despite attempted setting overrides and validate stored preference types.
- [x] Fix bubble density being overwritten on start, retain simple interactive bubbles in calm mode, and remove expired burst particles.
- [x] Suppress trail/bubble decoration when motion/particle preferences disallow it.
- [x] Correct stale BAT-FACE-001 documentation against recorded work-item evidence.
- [x] Add reusable browser checks and screenshots, preserving approved Battery artwork and registry bytes.
- [x] Add local-only V2 activity notes for caregiver review: visits and Finished sessions are recorded without scores, grades or mastery claims.
- [x] Add safe V2 offline cache registration for current V2 routes, shared engines and approved Battery web assets, with review/source/QA/rejected paths blocked.
- [x] Add route-level mobile performance smoke budget for current V2 activities at 390x844, including conservative FPS sampling and long-task observation.
- [x] Add route-level mobile accessibility smoke for the V2 home, eight current V2 activities and the offline fallback at 390x844, including touch target size, accessible names, keyboard settings close, reduced-motion cap, labelled canvases, horizontal overflow and blocked-art request checks.
- [x] Verify the internal character review surface in Chromium and WebKit across phone, tablet and desktop widths, including vector review derivatives, missing-state fallback, dark-background inspection, reference lazy-load and no review-art leakage into gameplay.
- [x] Add local-only V2 child profile switching for caregiver activity notes, with separate per-profile storage, no score/mastery claims, no medical/sensory-label inference, and mobile browser smoke evidence.
- [x] Add repeated V2 route lifecycle stress coverage for all eight current activities, proving one active shell/control set per route, no leaked pause/inert state, reduced-motion reapplication, and no console/page errors across 24 mobile navigations.
- [x] Implement the Sensory Mixer foundation on V2 home as local saved sensory-world presets that obey global preference ceilings and do not count as games.
- [x] Add a polite connection-status surface for V2 home and direct game entry, with safe offline fallback checks and mobile accessibility smoke coverage.
- [x] Add local caregiver activity-summary export for the active profile, limited to visits and Finished sessions and explicitly excluding scores, grades, mastery claims and medical/sensory labels.
- [x] Add a review-only character readiness matrix for supplied Leon, Zaya and Elephant artwork, showing five-state completeness and blockers while preserving production runtime art isolation.
- [x] Retire the old push-triggered character pilot extraction workflow and add approval-preservation verification so it cannot auto-run, write contents, invoke the chart-crop builder or push generated art.
- [x] Add explicit shared game-shell resource ownership and destroy coverage so future engines can register disposable resources and clean them up exactly once.
- [x] Add pinned npm check scripts, reproducible lockfile and a read-only GitHub Actions verification workflow for the current static V2 proof architecture.
- [x] Add the five-world V2 home entry map so children see Sensory, Maths, Literacy, Time/World and Characters choices before the detailed proof list.
- [x] Make the default `index.html` a V2-first sensory landing page, preserve the older long page at `sensory-lab.html`, and add browser evidence for the default route.
- [x] Add `Calm Rain Window` as the next no-pressure V2 sensory proof, using Canvas rain/ripples, shared settings, shared session controls, reduced-motion and calm-mode support.
- [x] Add `Firefly Catch` as a no-pressure V2 sensory proof, using Canvas glow tracking, shared settings, shared session controls, reduced-motion and calm-mode support.
- [x] Add `Snow Globe` as a no-pressure V2 sensory proof, using Canvas flakes, shared settings, shared session controls, reduced-motion and calm-mode support.
- [x] Add `Star Shower` as a no-pressure V2 sensory proof, using Canvas stars, shared settings, shared session controls, reduced-motion and calm-mode support.
- [x] Add `Growing Garden` as a no-pressure V2 sensory proof, using Canvas watering/growth, shared settings, shared session controls, reduced-motion and calm-mode support.
- [x] Add `Number Merge` as a no-pressure V2 early-learning proof, using shared settings, shared session controls, tap/select alternatives and bounded reward motion.
- [x] Add `Alphabet Adventure` as a no-pressure V2 early-learning proof, using shared settings, shared session controls, A-Z sequence navigation and optional sound.
- [x] Add `Shape Builder` as a no-pressure V2 early-learning proof, using the shared assembly engine, shared settings, shared session controls and tap-to-place alternatives.
- [x] Add `Letter Tracing` as a no-pressure V2 early-learning proof, using the shared trace engine, shared settings, shared session controls and Step alternative.

These changes remain preview work. They do not approve character art, claim production deployment, or complete all foundation contracts.

## Required remaining foundation work

- [ ] Reconcile the static proof architecture with the adopted Vite/TypeScript modular build target. Current work now has pinned npm check dependencies, reproducible lockfile and read-only CI for the static V2 proof architecture; full Vite/TypeScript migration remains outstanding.
- [ ] Complete full game-module preload/mount/start/pause/resume/reset/settings/destroy lifecycle and repeat-route cleanup tests. The current shared session wrapper handles pause/finish, explicit disposable resource ownership, exact-once destroy coverage and repeated-route cleanup stress coverage, but this is still not the entire module architecture.
- [x] Bridge legacy and V2 sensory preference stores for core controls. V2 now validates and exposes motion, sound, voice, music, vibration, calm mode, particles, speed, effects level, voice level, music level, contrast and pace; the legacy home reads/writes shared motion, sound, vibration, contrast and independent V2 audio-level settings. Deeper profile migration remains outstanding.
- [x] Implement and verify eight foundation engine contracts: memory-recall, physics-play, character-state-animation, world-shell-progress, asset-loader, performance-monitor, profile-progress-store, hint-feedback. These are foundation primitives, not completed games.
- [ ] Complete parent/profile controls, full error recovery and full offline behaviour. Local V2 activity notes now support separate local child profiles and local caregiver summary export, and the safe V2 route cache plus navigation-only offline fallback plus connection-status cues avoid false saved/mastery claims; full caregiver controls and full offline UX are still not complete.
- [x] Implement Sensory Mixer foundation using global preference ceilings; presets do not count as games. Further work remains for a richer creator/editor flow.
- [ ] Verify repeated route transitions, background suspension, full accessibility and physical iPhone Safari. Viewport-emulated repeated-route cleanup, accessibility and performance/long-task smoke checks now exist, but physical-device and full screen-reader evidence are still required.

## Character production requirements

Current registry: 69 canonical characters, 1 approved (Battery Buddy), 68 pending. Five approved energy-state derivatives; 340 pending/review energy-state assets. The completeness gate correctly fails.

- [x] Recover and preserve the five supplied individual Elephant PNGs; expose them only in the explicit character review page.
- [x] Recover and preserve supplied individual Leon/Zaya/Elephant review PNGs and real SVG trace derivatives; expose them only in the explicit character review page. Leon still lacks a supplied empty state and all guide review art remains pending production approval.
- [x] Expose review-only five-state readiness for supplied Leon, Zaya and Elephant candidates; this does not approve them for gameplay.
- [ ] Recover remaining original individual five-pose PNGs from “Math Game Upgrade”; inspect actual bytes, alpha, dimensions, identity and provenance before deciding whether replacements are needed.
- [ ] Resolve canonical Leon/Zaya identity review. Existing failed method pilots remain unapproved.
- [ ] Deliver verified individual masters (2048+ px longest edge), matching optimised derivatives and exact visible LEON/ZAYA names.
- [ ] Complete both guides’ five energy states, 12 outfit systems each, and all required teaching poses. Five energy poses alone do not finish wardrobes or teaching libraries.
- [ ] Complete 20 world characters and their required educational states; the five energy states do not replace world-specific actions.
- [ ] Complete A–Z, correct letterforms, lower-case partners, pronunciation references and educational metadata; no invented phonics audio approvals.
- [ ] Complete numbers 1–10 with accurate quantities and the required states.
- [ ] Complete canonical planet/space family and factual learning metadata.
- [ ] Reconcile additional legacy/chat characters (Elephant, Lion, Monkey, transport, etc.) against the canonical roster. The 69-character count must not silently erase other user-requested characters.
- [ ] Purposefully integrate approved characters with learning tasks; maintain safe fallback paths for pending art.
- [ ] Retain exact-version/hash-bound approval evidence. Never infer owner approval from successful automated validation.
- [ ] Complete style, identity, mobile legibility, light/dark alpha edge, reduced-motion and provenance reviews before promotion.

## Thirty-game map

Status below is the existing registry status, not an assertion of release completion. All entries still require the applicable final acceptance gates.

| Order | Game | Current status | Route |
| --- | --- | --- | --- |
| 1 | My Energy Battery | proof-owner-review-ready | v2-energy-battery.html |
| 2 | Dash to Charging Dock | proof | v2-dash-dock.html |
| 3 | Quiet Bubble Garden | accepted | v2-bubble-garden.html |
| 4 | Finger Light Trail | accepted | v2-light-trail.html |
| 5 | Hold to Breathe | accepted | v2-hold-to-breathe.html |
| 6 | Firefly Catch | proof | v2-firefly-catch.html |
| 7 | Calm Rain Window | proof | v2-calm-rain-window.html |
| 8 | Snow Globe | proof | v2-snow-globe.html |
| 9 | Star Shower | proof | v2-star-shower.html |
| 10 | Growing Garden | proof | v2-growing-garden.html |
| 11 | Number Merge | proof | v2-number-merge.html |
| 12 | Alphabet Adventure | proof | v2-alphabet-adventure.html |
| 13 | Shape Builder | proof | v2-shape-builder.html |
| 14 | Letter Tracing | proof | v2-letter-tracing.html |
| 15 | Number Tracing | proof | v2-number-tracing.html |
| 16 | Shape Tracing | proof | v2-shape-tracing.html |
| 17 | Colour Match | proof | v2-colour-match.html |
| 18 | Big & Small | proof | v2-big-small.html |
| 19 | Pattern Builder | proof | v2-pattern-builder.html |
| 20 | Sort It | proof | v2-sort-it.html |
| 21 | Planet Pals | specified | Not implemented |
| 22 | Build the Solar System | specified | Not implemented |
| 23 | Day & Night | specified | Not implemented |
| 24 | Days of the Week | specified | Not implemented |
| 25 | Months of the Year | specified | Not implemented |
| 26 | Seasons | specified | Not implemented |
| 27 | My First Clock | specified | Not implemented |
| 28 | Weather World | specified | Not implemented |
| 29 | Animal Habitats | specified | Not implemented |
| 30 | Transport Adventure | specified | Not implemented |

## Verification and release gates

Commands for this continuation (run from repository root):

```sh
node --check v2-engine.js
node --check js/v2-game-shell.js
node tools/check-internal-links.mjs
node tools/check-registries.mjs
node tools/check-v2-contracts.mjs
node tools/check-v2-foundation-engines.mjs
node tools/check-battery-dash-v2.mjs
node tools/check-character-assets.mjs
node tools/check-runtime-art-sources.mjs
node tools/check-battery-production-v3.mjs
node tools/check-character-approval-preservation-v3.mjs
node tools/check-character-integrity-regressions-v3.mjs
node tools/check-v2-session-browser.mjs
LEONSAL_TEST_BROWSER=webkit node tools/check-v2-session-browser.mjs
node tools/check-character-library-completeness-v3.mjs
```

The final command must remain red while the full required character library is incomplete. The internal-link legacy script only checks its four configured routes; the new browser test covers the five flagship previews separately.

Browser dependencies used: Playwright 1.62.1 from the available local runtime, Chromium and WebKit. No production dependency is loaded from that runtime or a CDN. Browser evidence is under `qa/session-completion/{chromium,webkit}/`.

Next artwork input: original separate PNGs, not screenshots/contact sheets. Next product review: the five flagship routes via `v2-home.html`. The preserved source mission requires staged visual/interaction acceptance before treating the first milestone as accepted. The current broad continuation authorises implementation work; it does not establish missing human visual approval.

No merge, deployment, DNS, CNAME, or production branch change was made in this continuation. Live-domain verification was unavailable through the web reader. A production release still requires confirmed preview acceptance, all applicable checks, and an explicit release decision.
