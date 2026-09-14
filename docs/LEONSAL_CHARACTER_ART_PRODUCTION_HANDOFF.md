# LeonSal Character Art Production Handoff

This document records the current character-art truth for the `fix/character-art-pipeline-v2` branch.

## Current Production Truth

- Battery Buddy V3 is the only approved production character.
- Battery Buddy has five approved runtime states: `empty`, `low`, `calm`, `happy`, `excited`.
- Leon, Zaya, alphabet, numbers, world characters and planets remain `pending-art`.
- Pending and rejected assets must expose no runtime image paths.
- Runtime must not load `source-safe-keeping`, QA evidence, contact sheets, review-only assets or rejected assets.

## Failed Paths

The bulk procedural SVG character rebuild is preserved as review history only. It is useful for testing registry structure and fallback behavior, but it does not meet the premium 3D LeonSal illustration standard.

The built-in image generation path produced useful Leon/Zaya style direction, but it did not produce production masters:

- `qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/leon-zaya-five-state-generated-review.png`
- `qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/leon-empty-individual-attempt/leon-empty-generated-review.png`
- `qa/character-production-v3/LEON-ZAYA-GENUINE-PILOT/leon-empty-background-extraction-attempt/leon-empty-bg-extraction-review.png`

Those files remain review evidence only because they are contact sheets or baked-checkerboard images without real alpha, and the individual attempts are below the 2048 px master-size requirement.

## Required Next Art Method

The next production method must return individual assets, not contact sheets:

- one transparent PNG master per character and state;
- minimum 2048 px longest edge;
- real alpha transparency with transparent corners;
- clean edges without checkerboard, white, grey or scene background;
- one character only;
- no labels, percentages, logos, neighbouring cells or source-sheet contamination;
- correct visible `LEON` and `ZAYA` text where guide clothing requires it;
- matching WebP derivatives generated from the accepted masters.

For Leon and Zaya, complete a small five-state pilot first. Do not generate A-Z, numbers, world or planet production assets until the guide method can pass the production gates.

## Promotion Rule

Do not mark a character `approved` unless the exact asset version has:

- production master and derivative files;
- visual QA evidence built from those exact files;
- identity and state-consistency review;
- registry hash/evidence binding;
- passing runtime-source safety checks;
- approval evidence for that specific version.

If any state fails, keep the character pending unless repository rules explicitly allow a partial-state approval.
