# LeonSal Sensory Mixer Spec

The Sensory Mixer now has a foundation implementation for local saved sensory-world presets. It is not a completed game system, and presets do not count as games.

## Purpose

The Mixer lets a child or caregiver combine approved sensory effects into saved worlds while staying inside global sensory preferences. A saved world is a request, not an override.

## Preference Precedence

1. Reduced Motion
2. Calm Mode
3. Sound
4. Vibration
5. Particles
6. Speed
7. Motion

If Sound is Off, opening a saved world with ocean audio remains silent. If Reduced Motion is On, a preset cannot turn full motion back on.

## Preset Contract

A preset records ID, name, visual theme, requested motion, requested sound, requested particle intensity, requested speed, calm compatibility, reduced-motion fallback, and exit availability. Canonical speed levels are super-slow, slow, medium, fast and super-speed; legacy saved normal maps to medium, and legacy lively maps to fast. Presets must not include medical labels or inferred regulation states.

## Product Count Rule

Mixer presets, aliases, variants, and saved worlds are not separate completed games. They are configurations of approved sensory concepts and reusable engines.

## Current Foundation

The current V2 home exposes three local preset examples: Quiet Glow, Bubble Calm, and Star Trail. They are saved only in local browser storage and resolve through the shared settings engine. The implementation must keep Sound Off silent, keep Reduced Motion reduced, cap particles and speed to the current global ceiling, avoid inferred medical/sensory labels, and keep a visible exit path.
