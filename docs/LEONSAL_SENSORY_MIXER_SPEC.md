# LeonSal Sensory Mixer Spec

The Sensory Mixer is specified here for future implementation. It is not complete in this adoption task.

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

A preset records ID, name, visual theme, requested motion, requested sound, requested particle intensity, requested speed, calm compatibility, reduced-motion fallback, and exit availability. Presets must not include medical labels or inferred regulation states.

## Product Count Rule

Mixer presets, aliases, variants, and saved worlds are not separate completed games. They are configurations of approved sensory concepts and reusable engines.
