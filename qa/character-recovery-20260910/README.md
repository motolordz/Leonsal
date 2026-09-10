# Character recovery — 10 September 2026

Verdict: PARTIALLY COMPLETE. Engineering corrections delivered; artwork pilot failed production gates and remains review-only.

Starting and verified remote baseline: `e5ebc22fe6c15d06feeea31e99e02b8ea102f109` on `fix/character-art-pipeline-v2`. This is one commit beyond the requested historical `6b80aca...`: it already included preservation and integrity checks and the first failed art pilot. Those changes were retained. The separate first-turn preview work was not merged into this repair branch.

The temporary checkout was removed by an environment reset during this run. A fresh clone of the same verified remote revision was recovered into the permanent `work/leonsal-recovery` directory. Engineering edits were restored from this task's exact saved tool commands. Seven supplied images were recovered from the original saved input-image payloads, not regenerated or screen-captured. Interrupted final checks were rerun after recovery.

## Engineering changes

- Registration now reads a structured approval decision containing the specific character, asset version, approved paths, and the hashes recorded by the review. It no longer turns an arbitrary existing evidence file into an approval bound to whatever files happen to exist at promotion time.
- The runtime-source gate validates non-Battery approval evidence and current asset hashes. Wrong character/version, changed evidence, and changed asset bytes fail the gate. This is a source validation gate, not client-side continuous hash monitoring.
- Battery retains its original approval format and dedicated production checks. It is not retroactively assigned fabricated new evidence.
- Registration tests cover full unrelated-record equality, targeted idempotence, missing and arbitrary approval evidence, and pending-art runtime exclusion. Binding tests use labelled temporary fixtures, never production approval.
- Production and adversarial tests share the same state-distinction function. Adjacent states must still exceed the existing 1.2 threshold; identical non-adjacent states also fail. Battery-copy detection compares decoded pixels and no longer depends on metadata or family iteration order.
- Browser assertions collect page errors and actual pending registry URLs, check approved image bounds, capture each active Battery state, and abort an actual image request to verify fallback recovery.

## Supplied assets

All seven original files are preserved under `assets/source-safe-keeping/recovery-20260910/`; `source-inventory.json` records exact hashes, dimensions, alpha and provenance.

Five Elephant images are individual 1254×1254 RGBA PNGs with real transparency. They are useful source artwork but fail the required 2048+ master size. Their outlines also need edge review, and the proposed calm image smiles/waves similarly to the happy pose. They were not upscaled, relabelled HD, or promoted.

The 1536×1024 Zaya five-state sheet is a reference, not five individual masters. Its lettering is mixed case, and its ponytail identity differs from the long-haired collection guide. The dedicated sheet was used as the more specific Zaya model reference for this pilot; final canonical identity is still subject to review.

The collection sheet is a reference only. Its claimed complete collection, alternate world roster, broad character labels are not evidence of registry completion.

## Creative method result

The built-in image_gen tool was available and used twice, once per individual model candidate. The actual calls and prompts are recorded in `generation-prompts.txt`.

- Leon: newly rendered calm model using the supplied collection guide reference.
- Zaya: newly rendered calm model using the dedicated supplied five-state reference.
- Individual originals and matching 640px WebP review derivatives: `assets/characters-v2/_staging/recovery-20260910/`.
- Exact-file review sheet: `guide-model-review.png`.
- Results and hashes: `pilot-results.json`.

Both outputs are only 1254×1254 RGB with **no alpha** and a baked checkerboard. They also lack final canonical-owner approval. LEON and ZAYA uppercase lettering was visually inspected and is readable, but that does not cure the failed technical gates. Neither candidate was cropped from a chart or enlarged and described as new master artwork. No further batches were generated using this unsuccessful output method.

New production-approved characters this run: **0**. New review-only characters: **2**, one calm model candidate each. These are not five-state sets, wardrobes or teaching libraries.

## Coverage and remaining work

| Family | Required canonical characters | Approved | Pending |
| --- | ---: | ---: | ---: |
| Guides | 2 | 0 | 2 |
| Alphabet | 26 | 0 | 26 |
| Numbers | 10 | 0 | 10 |
| World including Battery | 21 | 1 | 20 |
| Planets/space | 10 | 0 | 10 |
| Total | 69 | 1 | 68 |

There are five approved runtime state assets and 340 pending energy-state assets. The 12-outfit systems per guide, teaching poses, world educational actions and purposeful game integration remain additional requirements. Extra legacy/chat characters such as Elephant are not erased from the backlog by the 69-record canonical count.

Next art-production handoff: use the preserved actual reference files to author individual native 2048+ transparent PNGs, with clean edges and safe padding, and matching optimised derivatives. Resolve Leon/Zaya canonical identities before creating five energy states and scaling wardrobes/families. New candidates require actual exact-version visual/rights approval; no owner approval was invented here. Invalid transparency and resolution must be corrected before approval is requested.

## Evidence limits

`validation.json` records actual command results. Full-library completeness must fail while 68 characters remain pending. `battery-comparison.json` compares all ten original master/derivative hashes. Runtime browser evidence is local Chromium at phone, tablet and desktop sizes, with reduced motion and character transitions; this run does not claim physical iPhone Safari, full keyboard/touch/calm-mode coverage or production deployment proof.

Perceptual checks are not a semantic face/body recogniser. They cannot independently certify meaningful emotion changes or detect every decoration-only difference; that remains an independent visual-review gate. Existing fully transparent, wrong-derivative and duplicate-image fixtures remain in place. Human review and rights declarations are required in evidence but are not cryptographically authenticated by the schema validator.

No merge, deploy, force-push, root-route migration, or accepted Battery art change is authorised or performed by this milestone.
