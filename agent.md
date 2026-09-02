# LEONSAL CHARACTER STATE SYSTEM

## Mandatory Character Behaviour

LeonSal characters are interactive teaching characters, not static decoration.

Any character used in an energy, emotion, routine, sensory, reward, learning-state or progression interaction MUST support multiple visual states.

### Standard Five-State Character Model

Every applicable LeonSal character must support:

1. 0% - EMPTY / SLEEPY
   - exhausted
   - sleepy
   - sad/low-energy expression where contextually appropriate
   - slumped/resting body position
   - eyes partly or fully closed
   - optional blanket, pillow, ZZZ or resting treatment

2. 25% - LOW
   - tired
   - worried/low-energy
   - slower body posture
   - reduced animation
   - visually distinct from 0% and 50%

3. 50% - CALM / READY
   - neutral-positive expression
   - upright body
   - calm animation
   - ready to participate

4. 75% - HAPPY / ACTIVE
   - clearly happy
   - energetic pose
   - stronger movement
   - waving, walking, bouncing or equivalent character-specific action

5. 100% - FULL / EXCITED
   - maximum positive energy
   - full-body excited pose
   - jumping, flying, dancing, celebrating or equivalent
   - optional stars/sparkles/celebration effects
   - must remain sensory-safe when reduced-motion mode is enabled

## Character Transformation Rule

Changing state must NOT mean merely changing text, percentage or facial expression.

Where appropriate, state transitions must change:

- facial expression
- eyes
- eyebrows
- mouth
- body posture
- arms/hands
- legs/feet
- pose
- character orientation
- movement/animation
- accessories
- clothing/outfit
- environmental effects
- contextual props

Different characters should express energy in ways appropriate to that character.

Examples:

Battery Buddy:
sleeping -> exhausted -> standing calmly -> active -> jumping/celebrating

Elephant:
sleeping -> tired sitting -> standing calmly -> walking/happy -> jumping/celebrating

Plane:
parked/asleep -> tired/slow -> ready -> flying -> fast celebratory flight

Boat:
sleeping/resting -> low-energy floating -> calm sailing -> active sailing -> celebratory waves

Letter characters:
slumped/asleep -> tired -> upright/ready -> waving/happy -> jumping/superhero/celebration

Vehicle characters:
must communicate emotion through eyes, body angle, movement, lights, wheels/propellers and contextual effects.

## Shared Character Library

The same character state assets must be reusable across LeonSal.

Do NOT recreate a different version of the same character separately inside every game.

Preferred structure:

```text
/assets/characters/
  battery/
    empty.png
    low.png
    calm.png
    happy.png
    excited.png

  elephant/
    empty.png
    low.png
    calm.png
    happy.png
    excited.png

  plane/
  boat/
  bus/
  letter-a/
  star/
  sun/
  cloud/
  rainbow/
  dinosaur/
  lion/
  monkey/
  turtle/
  clownfish/
  rocket/
  train/
  car/
  helicopter/
  robot/
  apple/
  cupcake/
  soccer-ball/
  pencil/
  house/
  tree/
```

Each applicable character receives the same five-state architecture.

Assets should be:
- HD
- transparent PNG/WebP where appropriate
- consistent character proportions
- consistent art direction
- appropriately cropped
- never stretched
- responsive
- optimized for web delivery

## State Engine

Games must reference a shared character-state system rather than hardcoding unrelated character behaviour.

Canonical states:

- EMPTY
- LOW
- CALM
- HAPPY
- EXCITED

Example mapping:

```text
0-19%   = EMPTY
20-39%  = LOW
40-64%  = CALM
65-89%  = HAPPY
90-100% = EXCITED
```

Exact thresholds may be changed for a specific educational interaction when pedagogically justified.

Slider movement should update the character continuously and immediately when crossing a state boundary.

## Animation

Transitions should feel alive.

Examples:
- EMPTY -> LOW: character wakes slightly
- LOW -> CALM: character stands/prepares
- CALM -> HAPPY: character becomes active
- HAPPY -> EXCITED: character celebrates

Do not simply swap images abruptly when a short transition can improve comprehension.

However:

Reduced Motion = ON

must disable or greatly reduce:
- bouncing
- shaking
- flying
- spinning
- confetti
- rapid transitions

The educational state change must remain understandable without animation.

## Sensory Controls

All games using animated characters must respect the global LeonSal settings:

- Motion on/off
- Sound on/off
- Vibration on/off
- Reduced motion
- Calm mode
- Confetti on/off

Character state logic must continue working when all sensory effects are disabled.

## Cross-Game Consistency

If Battery Buddy at 0% means EMPTY/SLEEPY in one game, it must not mean HAPPY in another.

The five-state visual language is a LeonSal-wide convention.

Children should eventually recognise:

- 0% = needs rest
- 25% = low energy
- 50% = calm/ready
- 75% = active/happy
- 100% = full/excited

without needing to read the labels.

## Educational Purpose

The system is intended to teach concepts including:

- energy levels
- emotional recognition
- self-awareness
- routines
- rest
- morning/night transitions
- sequencing
- cause and effect
- percentages
- number scales
- comparison
- gradual change

Do not present energy level as a clinical measurement of a child's emotional or medical state.

## Character Expansion

New LeonSal characters should be designed for this system from the beginning.

Before approving a new recurring character, consider:

- neutral/default appearance
- EMPTY state
- LOW state
- CALM state
- HAPPY state
- EXCITED state
- reduced-motion presentation
- sound behaviour
- game-specific actions

## Acceptance Gate

A character-state feature is NOT complete unless:

- all five states work
- slider/state transitions work
- correct artwork appears
- character changes are visually obvious
- mobile Safari works
- assets are sharp and correctly scaled
- no stretched/cropped characters
- sound-off works
- motion-off works
- vibration-off works
- reduced-motion works
- direct game navigation works
- no broken asset URLs
- no console errors
- state behaviour is consistent across games
