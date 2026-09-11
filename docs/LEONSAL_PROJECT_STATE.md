# LeonSal — central project handoff

Updated 11 September 2026. This file connects the recovered artwork, existing activity preview and main Codex project conversation. It records implementation state; it does not grant artwork approval or release acceptance.

## Main brain and source

Main Codex task: **🧒🏻 LEONSAL.COM AGENT.MD**, ID `01a063ff-f441-78b2-a016-475aa0834bb8`.
Integration task: **Complete leonsal.com build**, ID `01a089f8-6b78-71a0-869a-8006ce826605`.

Permanent checkout: `/Users/mehdisalarzadeh/Documents/Codex/2026-09-10/hel/work/leonsal-recovery`.
Remote: `https://github.com/motolordz/Leonsal.git`.
Working branch: `fix/character-art-pipeline-v2`.
Integration base: `83a3b0ddd3ea47ade21d5fd93122a0b5cd456589`.

The old `/tmp/Leonsal-audit` checkout disappeared. The earlier `work/leonsal` preview has obsolete worktree metadata. Continue from the permanent checkout above. The main task received a direct context handoff before integration and will receive the final commit and preview links after verification.

Requirements remain in root `AGENTS.md`, `agent.md`, the interaction/sensory Bibles and registries. The [completion checklist](LEONSAL_COMPLETION_CHECKLIST.md) records the wider unfinished website scope. Character recovery provenance, failed method pilots and prior checks are in `qa/character-recovery-20260910/README.md`.

## Integrated experience

`v2-home.html` links five flagship activity previews with shared Home, Pause, Finished, resume and restart controls. This includes keyboard interaction, background suspension and reduced-motion repairs from the earlier preview patch. The home reads Battery artwork only from an approved production registry record and retains a CSS fallback when unavailable. Battery gameplay continues using its accepted gauge and charging lifecycle.

`character-review.html` is a clearly labelled internal review surface linked from the home footer. It displays the user's five individual Elephant poses at the canonical energy thresholds (0–19, 20–39, 40–64, 65–89, 90–100). Buttons and keyboard slider change poses; the background can switch between light and dark. There is no sound, autoplay or animation. Missing images show a recoverable message. Zaya and collection reference sheets load when the reviewer opens their section.

The supplied PNGs remain unchanged in `assets/source-safe-keeping/recovery-20260910/`. Optimised same-resolution Elephant WebPs live under `assets/character-review/elephant/`. `data/character-review.json` records the exact PNG paths, source hashes, sizes and review-only status. This separate review registry is never read by ordinary home/game routes.

## Artwork status and next action

Battery Buddy remains the sole approved character; its existing artwork and production registry are unchanged. Elephant's source PNGs are 1254 × 1254, below the required 2048 px master size. Its calm/happy distinction and alpha edges still need visual review. No upscale or automatic production approval was applied.

Zaya's five-state sheet and the collection sheet are references, not individual masters. The previous generated Leon/Zaya candidates failed alpha/resolution requirements and remain excluded from gameplay. Confirm canonical guide identity and obtain valid individual transparent masters before building more states, outfits and teaching poses. Do not repeat the failed method at full-library scale.

## Verification and release boundary

Run `node tools/check-character-review-browser.mjs` and `node tools/check-v2-session-browser.mjs`; repeat with `LEONSAL_TEST_BROWSER=webkit`. Evidence is under `qa/character-integration/` and `qa/session-completion/`. Registry, Battery, approval-preservation and source checks remain required. Full-library completeness must continue to fail while 68 canonical characters remain pending.

The browser tests cover desktop, tablet and phone viewports, five Elephant poses, keyboard controls, dark background, missing-image recovery, approved-only home loading and absence of review-image requests from gameplay. Viewport tests are not physical-device validation.

No merge, deployment, DNS or main-branch change is included. The public website is not claimed complete. Remaining foundation modules, 22 specified-only games and full artwork production are tracked in the completion checklist.
