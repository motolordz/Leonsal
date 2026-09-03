# LeonSal V2 — First 30 Games

These 30 games form the first serious LeonSal release programme. They are not to be built as 30 separate one-off HTML files. They are configurations and scenes built on the shared engines.

## Release groups

### Group A — Five flagship interaction proofs

1. My Energy Battery Lab
2. Dash to the Charging Dock
3. Quiet Bubble Garden
4. Finger Light Trail
5. Hold to Breathe

These five prove that the new engine platform is smooth, touch-friendly and sensory-controlled before the catalogue expands.

### Group B — Ten-game usable alpha

Add Calm Colour Flow, Rainmaker Window, Shape Snap Builder, Number Merge Playground and Alphabet Adventure.

### Group C — Twenty-game family beta

Add Firefly Field, My Sound Choices, Build My Calm Space, Count & Catch, Number Line Hop, Pattern Path, Sort & Pack, Memory Garden, Letter Sound Hunt and Trace the Letter.

### Group D — Thirty-game first public catalogue

Add Balance the Scale, Rhyming River, Word Builder, Story Sequence, Day Train, Month Wheel, Weather Lab, Planet Pals, How Do I Feel? and My Routine Builder.

## Game catalogue

| # | Game | World | Age | Primary engines | Core outcome | MVP proof |
|---:|---|---|---|---|---|---|
| 1 | **My Energy Battery Lab** | Sensory & Regulation | 3-8 | energy-svg-engine, character-state-engine | energy scale; cause and effect; self-awareness | Battery smoothly drains/fills; character state follows one canonical 0-100 scale. |
| 2 | **Dash to the Charging Dock** | Sensory & Regulation | 3-8 | energy-svg-engine, drag-snap-engine, character-state-engine | sequencing; cause and effect; energy routines | Position and energy are separate; start is 0%; dock animates 0→100%. |
| 3 | **Quiet Bubble Garden** | Sensory & Regulation | 3-8 | particle-play-engine | visual tracking; cause and effect; choice | Stable 60fps on iPhone; object pooling; bubble count and speed controls. |
| 4 | **Finger Light Trail** | Sensory & Regulation | 3-8 | trail-drawing-engine | fine motor; creative expression; tracking | Smooth path interpolation, high-DPI canvas and no page scrolling while drawing. |
| 5 | **Hold to Breathe** | Sensory & Regulation | 4-8 | breathing-pacing-engine, energy-svg-engine | pacing; body awareness; controlled interaction | Child controls every cycle and can stop instantly. |
| 6 | **Calm Colour Flow** | Sensory & Regulation | 3-8 | particle-play-engine | colour mixing; prediction; creative play | Procedural flow field with bounded particle count. |
| 7 | **Rainmaker Window** | Sensory & Regulation | 3-8 | particle-play-engine, audio-learning-engine | weather; cause and effect; direction | Rain density and sound independently controllable. |
| 8 | **Firefly Field** | Sensory & Regulation | 3-8 | particle-play-engine | visual attention; direction; gentle tracking | Soft glow with luminance limits and reduced-motion freeze mode. |
| 9 | **My Sound Choices** | Sensory & Regulation | 3-8 | audio-learning-engine | sound discrimination; choice; communication | Every sound user-triggered; stop button works immediately. |
| 10 | **Build My Calm Space** | Sensory & Regulation | 4-8 | drag-snap-engine, trail-drawing-engine | communication; planning; personal preference | Child can create, reset and locally save a calm-space picture. |
| 11 | **Number Merge Playground** | Maths & Logic | 4-8 | physics-engine, character-state-engine | addition; place value; number magnitude | Supports values beyond 10 without giant DOM blocks or layout failure. |
| 12 | **Count & Catch** | Maths & Logic | 3-7 | physics-engine, sort-match-engine | counting; one-to-one correspondence | 1-10 rounds with adjustable speed and no penalty for misses. |
| 13 | **Number Line Hop** | Maths & Logic | 4-8 | drag-snap-engine, character-state-engine | number order; addition; subtraction | Tap arrows work without dragging; number line remains stable. |
| 14 | **Shape Snap Builder** | Maths & Logic | 3-7 | drag-snap-engine, trail-drawing-engine | 2D shapes; spatial reasoning; composition | House roof is above the body; six complete pictures are visually coherent. |
| 15 | **Pattern Path** | Maths & Logic | 4-8 | sort-match-engine | patterns; prediction; reasoning | AB, AAB, ABB and ABC patterns with clear difficulty progression. |
| 16 | **Sort & Pack** | Maths & Logic | 3-7 | sort-match-engine, drag-snap-engine | classification; comparison; vocabulary | Data-driven categories; 3-bin maximum for early levels. |
| 17 | **Balance the Scale** | Maths & Logic | 5-8 | physics-engine | mass; equality; number bonds | Deterministic physics and visual equality cue. |
| 18 | **Memory Garden** | Maths & Logic | 3-8 | memory-engine | visual memory; matching; turn-taking | Board sizes 2x2, 3x4 and 4x4 with stable card positions. |
| 19 | **Alphabet Adventure** | Literacy | 3-7 | sort-match-engine, character-state-engine, audio-learning-engine | letter recognition; letter-sound association | A-Z order, clear glyphs, no robotic fallback voice when quality voice unavailable. |
| 20 | **Letter Sound Hunt** | Literacy | 4-7 | sort-match-engine, audio-learning-engine | phonemic awareness; vocabulary | Human-reviewed sound mapping and Australian-English audio set. |
| 21 | **Trace the Letter** | Literacy | 4-7 | trail-drawing-engine, character-state-engine | letter formation; fine motor | Path order cues, free retry and trace overlay that can be hidden. |
| 22 | **Rhyming River** | Literacy | 4-8 | sort-match-engine, audio-learning-engine | rhyme; listening; word families | Curated rhyme sets and clear non-rhyme distractors. |
| 23 | **Word Builder** | Literacy | 5-8 | drag-snap-engine, audio-learning-engine | blending; spelling; CVC words | Curated CVC progression and read-aloud on completion. |
| 24 | **Story Sequence** | Literacy | 4-8 | sequence-routine-engine | narrative order; before/after; comprehension | Tap-tap ordering plus drag; spoken captions optional. |
| 25 | **Day Train** | Time, World & Life | 4-7 | sequence-routine-engine, drag-snap-engine | days of week; before/after | Full order and next/previous-day modes. |
| 26 | **Month Wheel** | Time, World & Life | 5-8 | sequence-routine-engine, drag-snap-engine | months; calendar cycle; seasons | January-December order and birthday-month mode. |
| 27 | **Weather Lab** | Time, World & Life | 3-8 | particle-play-engine, sort-match-engine | weather; observation; cause and effect | Four safe weather modes with no flashing lightning. |
| 28 | **Leon's Planet Pals** | Time, World & Life | 4-8 | world-shell-engine, sort-match-engine, character-state-engine | solar system; planet names; order from Sun | Explorer, Find the Planet and Planet Parade modes with verified facts. |
| 29 | **How Do I Feel?** | Time, World & Life | 3-8 | character-state-engine, sort-match-engine, breathing-pacing-engine | emotion recognition; communication; self-advocacy | Visual choice board works without sound, reading or animation. |
| 30 | **My Routine Builder** | Time, World & Life | 3-8 | sequence-routine-engine, drag-snap-engine | sequencing; transition preparation; independence | Three-step visual routine with local save and reset. |

## Mandatory design pattern for every game

1. **Ready:** one sentence, one visual example and one obvious Start control.
2. **Play:** one activity occupies the stage; unrelated page content is hidden.
3. **Finished:** a stable completion card appears without surprise sound or forced confetti.
4. **Next:** Repeat, Another Game or Home.

## Difficulty model

- Level changes reduce or increase choices, distance, speed or sequence length—not visual clutter.
- No game requires a timer at the first difficulty.
- Hints are available on request and may become automatic only when a grown-up enables them.
- Incorrect attempts keep the child in the same calm scene.

## Future 31–60 expansion

After the first 30 are accepted, the next group can include Seasons Garden, Australian Money Shop, Syllable Clap, CVC Word Machine, Sight Word Garden, Animal Habitat Match, Life Cycle Builder, Plant a Seed, Water Cycle Journey, Sink or Float, Magnet Match, Five Senses, Ocean Layers, Dinosaur Sort, Insect Explorer, Copy the Beat, Fast and Slow, High and Low Sound, Instrument Match, Colour Mixer, Make a Melody, Sticker Studio, Personal Space, Asking for Help, Waiting My Turn, Safe or Unsafe, Planet Size Sort, Mars Rover Route, Moon Match and Solar System Memory.

Do not begin the second 30 until the shared engines and first 30 have reliable mobile acceptance.
