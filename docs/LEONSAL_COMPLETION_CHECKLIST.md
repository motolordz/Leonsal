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

These changes remain preview work. They do not approve character art, claim production deployment, or complete all foundation contracts.

## Required remaining foundation work

- [ ] Reconcile the static proof architecture with the adopted Vite/TypeScript modular build target; pin test/build dependencies and add reproducible lockfile/CI.
- [ ] Complete full game-module preload/mount/start/pause/resume/reset/settings/destroy lifecycle, resource ownership, and repeat-route cleanup tests. The current shared session wrapper handles pause/finish and now has repeated-route cleanup stress coverage, but this is still not the entire module architecture.
- [x] Bridge legacy and V2 sensory preference stores for core controls. V2 now validates and exposes motion, sound, voice, music, vibration, calm mode, particles, speed, effects level, voice level, music level, contrast and pace; the legacy home reads/writes shared motion, sound, vibration, contrast and independent V2 audio-level settings. Deeper profile migration remains outstanding.
- [x] Implement and verify eight foundation engine contracts: memory-recall, physics-play, character-state-animation, world-shell-progress, asset-loader, performance-monitor, profile-progress-store, hint-feedback. These are foundation primitives, not completed games.
- [ ] Complete parent/profile controls, full error recovery and full offline behaviour. Local V2 activity notes now support separate local child profiles, and the safe V2 route cache plus navigation-only offline fallback avoid false saved/mastery claims; full caregiver controls and full offline UX are still not complete.
- [x] Implement Sensory Mixer foundation using global preference ceilings; presets do not count as games. Further work remains for a richer creator/editor flow.
- [ ] Verify repeated route transitions, background suspension, full accessibility and physical iPhone Safari. Viewport-emulated repeated-route cleanup, accessibility and performance/long-task smoke checks now exist, but physical-device and full screen-reader evidence are still required.

## Character production requirements

Current registry: 69 canonical characters, 1 approved (Battery Buddy), 68 pending. Five approved energy-state derivatives; 340 pending/review energy-state assets. The completeness gate correctly fails.

- [x] Recover and preserve the five supplied individual Elephant PNGs; expose them only in the explicit character review page.
- [x] Recover and preserve supplied individual Leon/Zaya/Elephant review PNGs and real SVG trace derivatives; expose them only in the explicit character review page. Leon still lacks a supplied empty state and all guide review art remains pending production approval.
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
| 6 | Firefly Catch | specified | Not implemented |
| 7 | Calm Rain Window | specified | Not implemented |
| 8 | Snow Globe | specified | Not implemented |
| 9 | Star Shower | specified | Not implemented |
| 10 | Growing Garden | specified | Not implemented |
| 11 | Number Merge | legacy-existing | number-merge.html |
| 12 | Alphabet Adventure | legacy-existing | alphabet-adventure.html |
| 13 | Shape Builder | legacy-existing | shape-builder.html |
| 14 | Letter Tracing | specified | Not implemented |
| 15 | Number Tracing | specified | Not implemented |
| 16 | Shape Tracing | specified | Not implemented |
| 17 | Colour Match | specified | Not implemented |
| 18 | Big & Small | specified | Not implemented |
| 19 | Pattern Builder | specified | Not implemented |
| 20 | Sort It | specified | Not implemented |
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
