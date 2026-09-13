# Supplied character vector conversion

Fourteen individual user-supplied PNGs were converted to actual SVG spline paths using VTracer 0.6.15. Original source pixels/files are preserved. SVGs contain no embedded raster images, scripts, external dependencies or canvas rectangles. These are vector traces of the supplied 1254 px illustrations, not newly illustrated HD masters or animation rigs.

Coverage: Elephant 5/5, Zaya 5/5, Leon 4/5. The Lion multi-character sheet remains reference-only and was not cropped. The unrelated screenshot was excluded from the repository.

`character-review.html` defaults to SVG and offers comparison with original images, all canonical state anchors, character switching with preserved energy, and missing-state recovery. Ordinary game/home production resolvers still exclude these candidates. Battery remains unchanged.

## Visual inspection

`supplied-vector-states.png` uses the actual SVGs. Identity, supplied pose differences and transparency are preserved at review/mobile size. Fine texture becomes colour contours under extreme zoom. The high-detail files are about 3-9 MB each and are not ready for bulk homepage preload or a skeletal animation rig.

Remaining deficiencies: Leon empty is missing; guide clothing needs exact uppercase LEON/ZAYA rather than the source lettering; final safe-padding/edge and production identity checks remain open. The separate authored Leon empty candidate was inspected and rejected because flat eyelid/mouth patches break the face's rendering style. Its verdict is recorded in `leon-empty-candidate.json`; it is never selectable.

No production approval was created. No master PNG was upscaled. No full-library completion or running/sports animation is claimed.

## Reproduction

Install build-only Python dependencies `vtracer==0.6.15` and `Pillow==11.3.0` in an isolated environment. From repository root, run `tools/trace-supplied-characters.py --character leon` (then zaya and elephant), `node tools/check-vector-character-review.mjs`, and `node tools/build-vector-review-sheet.mjs`.

Browser tests: `node tools/check-character-review-browser.mjs` and the same command with `LEONSAL_TEST_BROWSER=webkit`. They verify SVG decode, identity/state selection, raster comparison, keyboard interaction, missing Leon empty, network-failure recovery, responsive overflow and absence of review requests from games. Screenshots are under `qa/character-integration/`.

VTracer: https://github.com/visioncortex/vtracer (MIT). Source artwork was supplied by the owner; no new third-party character artwork was introduced.
