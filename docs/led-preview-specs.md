# WLED LED Preview Application — Specification

## Table of Contents

1. [Overview](#1-overview)
2. [Colors](#2-colors)
3. [Animations (Effects)](#3-animations-effects)
4. [JSON API Specification](#4-json-api-specification)
5. [Application Architecture](#5-application-architecture)
6. [Implementation Details](#6-implementation-details)

---

## 1. Overview

### Purpose

The LED Preview Application is a React-based web application that allows users to load WLED JSON configuration files (presets, state snapshots, or API payloads) and visually preview the expected LED behavior in a browser — without requiring physical hardware.

### Scope

The application must:

- Parse WLED JSON state objects, preset files, and playlist definitions
- Render a virtual LED strip (1D) or matrix (2D) that faithfully reproduces WLED's color, effect, and segment behavior
- Animate effects in real-time at configurable frame rates (default 42 FPS)
- Support multiple segments with independent effects, colors, palettes, and blending
- Handle grouping, spacing, mirroring, and reversal of segments
- Provide a file picker to load `.json` configuration files

### WLED JSON Sources

The app consumes JSON in three forms:

| Source          | Description                                           | Example                                            |
| --------------- | ----------------------------------------------------- | -------------------------------------------------- |
| **State JSON**  | Real-time device state from `/json/state`             | `{"on":true,"bri":128,"seg":[...]}`                |
| **Preset file** | Saved presets from device filesystem (`presets.json`) | `{"1":{"n":"Warm","on":true,...},"2":{...}}`       |
| **Playlist**    | Timed sequences of presets                            | `{"playlist":{"ps":[1,2,3],"dur":[50,50,50],...}}` |

---

## 2. Colors

### 2.1 Color Model

WLED uses a 32-bit RGBW color model internally. Each color is stored as a `uint32_t` packed as:

```
Byte 3 (MSB)   Byte 2      Byte 1      Byte 0 (LSB)
[  White  ]   [  Red   ]   [ Green  ]   [  Blue  ]
   W(24)        R(16)        G(8)         B(0)
```

Each channel is 0–255. For RGB-only strips, the White channel is 0.

### 2.2 Color Slots

Each segment has **3 color slots**:

| Slot      | Index | Name       | Usage                                              |
| --------- | ----- | ---------- | -------------------------------------------------- |
| Primary   | 0     | Foreground | Main color used by most effects                    |
| Secondary | 1     | Background | Background or alternate color                      |
| Tertiary  | 2     | Accent     | Third color used by some effects (chase, tricolor) |

### 2.3 JSON Color Input Formats

Colors in the JSON `"col"` array accept five formats. The preview app must handle all of them:

#### Format 1: RGB/RGBW Array (most common)

```json
"col": [[255, 0, 0], [0, 255, 0, 128], [0, 0, 255]]
```

- 3-element arrays: `[R, G, B]` — White defaults to 0
- 4-element arrays: `[R, G, B, W]`

#### Format 2: Hex String

```json
"col": ["FF0000", "00FF0080", "0000FF"]
```

- 6-character hex: `RRGGBB`
- 8-character hex: `RRGGBBWW`

#### Format 3: Color Temperature (Kelvin)

```json
"col": [6500, 4000, 2700]
```

Integer values are interpreted as Kelvin color temperature. Convert using standard Kelvin-to-RGB formulas (Tanner Helland algorithm). Range: approximately 1900K–10091K.

#### Format 4: Object with Named Channels

```json
"col": [
  {"r": 255, "g": 0, "b": 0, "w": 0},
  {"r": 0, "g": 255},
  {"b": 255}
]
```

Omitted channels default to 0 (or remain unchanged if updating).

#### Format 5: Random

```json
"col": ["r", "r", "r"]
```

The string `"r"` generates a random color for that slot.

### 2.4 Color Blending

Two colors are blended using channel-wise linear interpolation:

```typescript
function colorBlend(color1: number, color2: number, blend: number): number {
  // blend: 0 = 100% color1, 255 = 100% color2
  const r = (r1 * (255 - blend) + r2 * blend) >> 8
  const g = (g1 * (255 - blend) + g2 * blend) >> 8
  const b = (b1 * (255 - blend) + b2 * blend) >> 8
  const w = (w1 * (255 - blend) + w2 * blend) >> 8
  return (w << 24) | (r << 16) | (g << 8) | b
}
```

### 2.5 Color Fading

Fading reduces brightness by scaling each channel:

```typescript
function colorFade(color: number, amount: number): number {
  // amount: 255 = no fade, 0 = full black
  // Each channel: channel = (channel * amount) >> 8
}
```

A "video fade" variant preserves hue by keeping channels above 1/8 of the dominant channel alive at minimum value 1.

### 2.6 HSV Conversions

WLED uses 16-bit hue (0–65535) for precision. Standard conversion:

- **Hue**: 0–65535 (mapped to 360° color wheel; 6 regions of 10923 each)
- **Saturation**: 0–255
- **Value**: 0–255

The `color_wheel(pos)` function maps a single byte (0–255) to a rainbow:

```
pos 0-84:    R descends 255→0,  G ascends 0→255,  B = 0
pos 85-169:  R = 0,             G descends 255→0,  B ascends 0→255
pos 170-255: R ascends 0→255,   G = 0,             B descends 255→0
```

### 2.7 Gamma Correction

Optional gamma correction is applied per-channel using a lookup table with configurable gamma value (default 2.8):

```
corrected = round(pow(channel / 255, gamma) * 255)
```

The preview app should support toggling gamma on/off.

---

## 3. Animations (Effects)

### 3.1 Overview

WLED includes **219 built-in effects** (IDs 0–218). Each effect is a function that runs once per frame and writes pixel colors to a segment's pixel buffer. Effects are categorized as:

| Category            | Description               | Examples                               |
| ------------------- | ------------------------- | -------------------------------------- |
| **1D**              | Linear strip effects      | Solid, Blink, Chase, Rainbow, Fire     |
| **2D**              | Matrix/grid effects       | Matrix rain, DNA, Game of Life, Plasma |
| **Audio-Reactive**  | Respond to sound input    | GEQ, Gravimeter, Pixelwave             |
| **Particle System** | Physics-based simulations | Fireworks, Volcano, Vortex, Pinball    |

### 3.2 Effect Parameters

Every effect has access to these configurable parameters:

| Parameter | JSON Key | Range | Description                                      |
| --------- | -------- | ----- | ------------------------------------------------ |
| Speed     | `sx`     | 0–255 | Animation speed (often inverse: higher = faster) |
| Intensity | `ix`     | 0–255 | Effect intensity, density, or duty cycle         |
| Custom 1  | `c1`     | 0–255 | Effect-specific parameter (e.g., trail length)   |
| Custom 2  | `c2`     | 0–255 | Effect-specific parameter (e.g., blur amount)    |
| Custom 3  | `c3`     | 0–31  | Effect-specific parameter (5-bit, reduced range) |
| Option 1  | `o1`     | bool  | Effect-specific flag (e.g., dual mode)           |
| Option 2  | `o2`     | bool  | Effect-specific flag                             |
| Option 3  | `o3`     | bool  | Effect-specific flag                             |
| Palette   | `pal`    | 0–71  | Color palette index                              |

### 3.3 Effect Metadata Format

Each effect provides a metadata string that describes its UI controls:

```
"EffectName@SpeedLabel,IntensityLabel,Custom1Label,...;Color1,Color2,Color3;PaletteFlag;DimensionFlags;DefaultValues"
```

**Sections (semicolon-delimited):**

| Section      | Position | Description                                                         |
| ------------ | -------- | ------------------------------------------------------------------- |
| Speed/Params | 1st `;`  | Comma-separated labels for Speed, Intensity, C1, C2, C3, O1, O2, O3 |
| Colors       | 2nd `;`  | Which color slots the effect uses (`!` = uses slot)                 |
| Palette      | 3rd `;`  | `!` = uses palette, empty = no palette                              |
| Dimensions   | 4th `;`  | `0` or `01` = 1D only, `2` = 2D only, `12` = both                   |
| Defaults     | 5th `;`  | `key=value` pairs: `pal=35,sx=128,ix=255,c1=32`                     |

**Real examples from firmware:**

```
"Solid"                                          — No parameters
"Blink@!,Duty cycle;!,!;!;01"                   — Speed, intensity; 2 colors; palette; 1D
"Breathe@!;!,!;!;01"                            — Speed only; 2 colors; palette; 1D
"Chase@!,Width;!,!,!;!;12"                      — Speed, width; 3 colors; palette; 1D+2D
"Fire 2012@Cooling,Spark rate,,2D Blur,Boost;;!;1;pal=35,sx=64,ix=160,m12=1,c2=128"
"Scanner@!,Trail,Delay,,,Dual,Bi-delay;!,!,!;!;;m12=0,c1=0"
```

### 3.4 Frame Rendering Model

The preview app must implement a frame loop that matches WLED's rendering model:

```
Target FPS: 42 (configurable)
Frame time: ~24ms (1000 / 42)

Each frame:
  1. Calculate elapsed time since last frame
  2. For each active segment:
     a. Run the effect function with current parameters
     b. Effect writes to segment pixel buffer
  3. Apply segment blending (if multiple segments overlap)
  4. Apply global brightness
  5. Render pixel buffer to screen
```

**Key timing variables to track:**

| Variable | Type       | Description                                         |
| -------- | ---------- | --------------------------------------------------- |
| `now`    | `uint32_t` | Milliseconds since app start (replaces `strip.now`) |
| `call`   | `uint32_t` | Per-segment frame counter (increments each frame)   |
| `step`   | `uint32_t` | Per-segment state counter (effect-specific usage)   |
| `aux0`   | `uint16_t` | Auxiliary state variable 0                          |
| `aux1`   | `uint16_t` | Auxiliary state variable 1                          |

### 3.5 Animation Types and Algorithms

Below are the core animation patterns used across WLED's effects. The preview app should implement these as composable building blocks:

#### 3.5.1 Solid Fill

**Effects**: Solid (0)

```
Fill entire segment with primary color (color slot 0).
```

No animation. Single-frame render.

#### 3.5.2 Time-Based Blink / Pulse

**Effects**: Blink (1), Strobe (23), Strobe Rainbow (24)

```
cycleTime = (255 - speed) * 20           // ms per full cycle
onTime = (cycleTime * intensity) >> 8     // duty cycle portion
phase = now % cycleTime

if phase < onTime:
    fill(color1)       // or palette color
else:
    fill(color2)       // background color
```

- **Speed** controls cycle frequency (inverted: higher = faster)
- **Intensity** controls duty cycle (0 = always off, 255 = always on)

#### 3.5.3 Sine-Wave Breathing

**Effects**: Breathe (2), Heartbeat (105)

```
counter = (now * ((speed >> 3) + 10)) & 0xFFFF
luminance = 30 + sin16(counter) / 103      // range ~30–180

for each pixel i:
    color = blend(backgroundColor, paletteColor(i), luminance)
    setPixel(i, color)
```

- Produces smooth sinusoidal brightness oscillation
- **Speed** controls breathing rate
- Colors blend between background (slot 1) and primary/palette

#### 3.5.4 Progressive Wipe

**Effects**: Color Wipe (3), Color Sweep (6)

```
cycleTime = 750 + (255 - speed) * 150     // ms per full cycle
progress = (now % cycleTime) * 65535 / cycleTime
back = progress > 32767                    // second half = reverse

ledIndex = (progress * segLen) >> 15       // current wipe position

for each pixel i:
    if (i < ledIndex) XOR back:
        setPixel(i, wipingColor)
    else:
        setPixel(i, backgroundColor)
```

- Linear fill from start to end, then reverse
- Sub-pixel blending at the wipe edge for smoothness

#### 3.5.5 Rainbow / Color Wheel

**Effects**: Rainbow Cycle (9), Colorloop (8)

```
counter = (now * ((speed >> 2) + 2)) >> 8     // 0–255 phase offset
zoom = 16 << (intensity / 29)                  // 1x–256x zoom

for each pixel i:
    wheelIndex = (i * zoom / segLen + counter) & 0xFF
    setPixel(i, colorWheel(wheelIndex))
```

- Each pixel maps to a position on the 256-color wheel
- **Speed** controls rotation speed
- **Intensity** controls how many rainbow cycles fit across the strip

#### 3.5.6 Chase / Running Pattern

**Effects**: Chase (28–33), Theater Chase (14), Running Lights (16)

```
headPosition = (now * (speed >> 2 + 1) * segLen) >> 16   // wrapping
blockSize = 1 + (intensity * segLen) >> 10

fill(backgroundColor)                          // or palette

for j in range(blockSize):
    setPixel((headPosition + j) % segLen, chaseColor)
```

- Block of lit pixels travels across the strip
- **Speed** controls movement speed
- **Intensity** controls block size (trail length)
- Wraps around at segment boundaries

#### 3.5.7 Cellular Automaton (Fire)

**Effects**: Fire 2012 (66)

```
heat[segLen]                                   // persistent heat array

// Step 1: Cool each cell
for each cell:
    heat[i] -= random(coolingFactor)           // speed affects cooling

// Step 2: Heat drifts upward
for i from top to 2:
    heat[i] = (heat[i-1] + heat[i-2] * 2) / 3

// Step 3: Ignite random sparks at bottom
if random() <= intensity:
    heat[randomBottom] += random(96, 207)

// Step 4: Map heat to palette colors
for each cell:
    setPixel(i, paletteColor(heat[i]))
```

- **Speed** controls cooling rate (faster = cooler, blue flames)
- **Intensity** controls spark frequency
- Default palette: Fire (ID 35 — black → red → yellow → white)

#### 3.5.8 Random Activation (Twinkle / Sparkle)

**Effects**: Twinkle (17), Sparkle (21), Twinklefox (80), Twinklecat (81)

```
fadeAll(224)                                    // decay existing pixels to 87.5%

cycleTime = 20 + (255 - speed) * 5
if newCycle:
    maxActive = map(intensity, 0, 255, 1, segLen)
    position = pseudoRandom(seed) % segLen
    setPixel(position, paletteColor(position))
```

- Each cycle activates one random pixel
- Previously active pixels fade gradually
- **Speed** controls activation rate
- **Intensity** controls max simultaneous active pixels
- Deterministic PRNG (LCG: `seed = seed * 2053 + 13849`) ensures consistent patterns

#### 3.5.9 Meteor / Comet Trail

**Effects**: Meteor (76), Comet (43)

```
trail[segLen]                                   // persistent trail brightness

headPos = (now * speed) % segLen

// Fade existing trails randomly
for each pixel i:
    if random() > intensity:                    // intensity = trail persistence
        trail[i] = scale(trail[i], random(128, 255))

// Draw meteor head
for j in range(meteorSize):
    trail[(headPos + j) % segLen] = 255

// Render
for each pixel i:
    setPixel(i, paletteColor(trail[i]))
```

- Moving head with randomly decaying trail
- **Speed** controls head movement
- **Intensity** controls trail decay rate (higher = longer trail)

#### 3.5.10 Wave Propagation (Ripple)

**Effects**: Ripple (79), Ripple Rainbow (104)

```
ripples[maxRipples]     // {state, position, color}

for each ripple:
    if active:
        distance = (state / decay - 1) * speed
        amplitude = triangleWave(state * 8)

        for v in range(4):                     // 4-pixel wide wavefront
            magnitude = cubicWave(fractional + v*64) * amplitude
            setPixel(pos - distance + v, blend(existing, rippleColor, magnitude))
            setPixel(pos + distance - v, blend(existing, rippleColor, magnitude))

        state += decay
        if state > 254: deactivate

    else if random() < intensity:
        activate at random position
```

- Expanding circular waves from random origin points
- **Speed** controls propagation speed and decay
- **Intensity** controls ripple spawn frequency
- Wave front uses cubic wave shape for smooth appearance

### 3.6 Complete Effect List

All 219 effects with IDs:

| ID      | Name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ID  | Name              | ID  | Name                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ----------------- | --- | --------------------- |
| 0       | Solid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 1   | Blink             | 2   | Breathe               |
| 3       | Color Wipe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 4   | Color Wipe Random | 5   | Random Color          |
| 6       | Color Sweep                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 7   | Dynamic           | 8   | Colorloop (Rainbow)   |
| 9       | Rainbow Cycle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 10  | Scan              | 11  | Dual Scan             |
| 12      | Fade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 13  | Theater Chase     | 14  | Theater Chase Rainbow |
| 15      | Running Lights                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 16  | Saw               | 17  | Twinkle               |
| 18      | Dissolve                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 19  | Dissolve Random   | 20  | Sparkle               |
| 21      | Flash Sparkle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 22  | Hyper Sparkle     | 23  | Strobe                |
| 24      | Strobe Rainbow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 25  | Multi Strobe      | 26  | Blink Rainbow         |
| 27      | Android                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 28  | Chase Color       | 29  | Chase Random          |
| 30      | Chase Rainbow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 31  | Chase Flash       | 32  | Chase Flash Random    |
| 33      | Chase Rainbow White                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 34  | Colorful          | 35  | Traffic Light         |
| 36      | Color Sweep Random                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 37  | Running Color     | 38  | Aurora                |
| 39      | Running Random                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 40  | Larson Scanner    | 41  | Comet                 |
| 42      | Fireworks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 43  | Rain              | 44  | Tetrix                |
| 45      | Fire Flicker                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 46  | Gradient          | 47  | Loading               |
| 48      | Rolling Balls                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 49  | Fairy             | 50  | Two Dots              |
| 51      | Fairy Twinkle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 52  | Running Dual      | 53  | Image                 |
| 54      | Tricolor Chase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 55  | Tricolor Wipe     | 56  | Tricolor Fade         |
| 57      | Lightning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 58  | ICU               | 59  | Multi Comet           |
| 60      | Dual Larson Scanner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 61  | Random Chase      | 62  | Oscillate             |
| 63      | Pride 2015                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 64  | Juggle            | 65  | Palette               |
| 66      | Fire 2012                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 67  | Colorwaves        | 68  | BPM                   |
| 69      | Fill Noise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 70  | Noise 1           | 71  | Noise 2               |
| 72      | Noise 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 73  | Noise 4           | 74  | Colortwinkle          |
| 75      | Lake                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 76  | Meteor            | 77  | Copy                  |
| 78      | Railway                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 79  | Ripple            | 80  | Twinklefox            |
| 81      | Twinklecat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 82  | Halloween Eyes    | 83  | Static Pattern        |
| 84      | Tri Static Pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 85  | Spots             | 86  | Spots Fade            |
| 87      | Glitter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 88  | Candle            | 89  | Starburst             |
| 90      | Exploding Fireworks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 91  | Bouncing Balls    | 92  | Sinelon               |
| 93      | Sinelon Dual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 94  | Sinelon Rainbow   | 95  | Popcorn               |
| 96      | Drip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 97  | Plasma            | 98  | Percent               |
| 99      | Ripple Rainbow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 100 | Heartbeat         | 101 | Pacifica              |
| 102     | Candle Multi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 103 | Solid Glitter     | 104 | Sunrise               |
| 105     | Phased                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 106 | Twinkle Up        | 107 | Noise Pal             |
| 108     | Sine Wave                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 109 | Phased Noise      | 110 | Flow                  |
| 111     | Chunchun                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 112 | Dancing Shadows   | 113 | Washing Machine       |
| 114–117 | 2D Plasma/Rotozoom variants                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 118 | Blends            |
| 119     | TV Simulator                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 120 | Dynamic Smooth    |
| 121–131 | 2D: Spaceships, Crazy Bees, Ghost Rider, Blobs, Scrolling Text, Drift Rose, Distortion Waves, Soap, Octopus, Waving Cell                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 132–186 | Audio-Reactive: Pixels, Pixelwave, Juggles, Matripix, Gravimeter, Plasmoid, Puddles, Midnoise, Noisemeter, Freqwave, Freqmatrix, 2D GEQ, Waterfall, Freqpixels, Noisefire, Puddlepeak, Noisemove, 2D Noise, Perlin Move, Ripple Peak, 2D Fire Noise, 2D Squared Swirl, DNA, 2D Matrix, 2D Metaballs, Freqmap, Gravcenter, Gravcentric, Gravfreq, DJ Light, 2D Funky Plank, Shimmer, 2D Pulser, Blurz, 2D Drift, 2D Waverly, 2D Sun Radiation, 2D Colored Bursts, 2D Julia, 2D Game of Life, 2D Tartan, 2D Polar Lights, 2D Swirl, 2D Lissajous, 2D Frizzles, 2D Plasma Ball, Flowstripe, 2D Hiphotic, 2D Sin Dots, 2D DNA Spiral, 2D Black Hole, Wavesins, Rocktaves, 2D Akemi |
| 187–218 | Particle System: Volcano, Fireworks, Vortex, Waterfall, Box, Attractor, Drip, Pinball, Chase, Starburst, GEQ, Sonic Stream, and more                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

> **Implementation note**: The preview app does not need to implement all 219 effects at launch. Start with the 10 core algorithm types from Section 3.5 which cover ~80% of visual patterns. Additional effects can be added incrementally.

### 3.7 Palette System

#### 3.7.1 Palette Types

| ID Range | Type              | Count | Description                                               |
| -------- | ----------------- | ----- | --------------------------------------------------------- |
| 0        | Default           | 1     | Uses segment's color slots directly                       |
| 1        | Random Cycle      | 1     | Randomly selects a gradient palette and cycles            |
| 2        | Color 1           | 1     | Gradient from black → primary color → black               |
| 3        | Colors 1&2        | 1     | Gradient between primary and secondary colors             |
| 4        | Color Gradient    | 1     | Smooth gradient across primary color hue                  |
| 5        | Colors Only       | 1     | Uses only segment color slots (no gradients)              |
| 6–12     | FastLED Built-in  | 7     | Party, Cloud, Lava, Ocean, Forest, Rainbow, Rainbow Bands |
| 13–71    | Gradient Palettes | 59    | Named color gradients (Sunset, Fire, Aurora, etc.)        |

**Total: 72 fixed palettes** (IDs 0–71) plus user-defined custom palettes.

#### 3.7.2 Gradient Palette Data Format

Each palette is an array of gradient stops. Each stop is 4 bytes:

```
[position, red, green, blue]
```

- **Position**: 0–255 (0 = start, 255 = end of gradient)
- **RGB**: 0–255 per channel

Example — Fire palette (ID 35):

```json
[
  [0, 0, 0, 0],
  [46, 77, 0, 0],
  [96, 177, 0, 0],
  [108, 196, 38, 9],
  [119, 215, 76, 19],
  [146, 235, 115, 29],
  [174, 255, 153, 41],
  [188, 255, 178, 41],
  [202, 255, 204, 41],
  [218, 255, 230, 41],
  [234, 255, 255, 41],
  [244, 255, 255, 143],
  [255, 255, 255, 255]
]
```

To sample a color at any position `p` (0–255):

1. Find the two stops `a` and `b` where `a.position <= p <= b.position`
2. Calculate `t = (p - a.position) / (b.position - a.position)`
3. Linearly interpolate: `color = lerp(a.rgb, b.rgb, t)`

#### 3.7.3 Built-in Gradient Palettes

| ID  | Name          | Description                  |
| --- | ------------- | ---------------------------- |
| 13  | Sunset        | Dark red → orange → purple   |
| 14  | Rivendell     | Greens and teals             |
| 15  | Breeze        | Light blues and whites       |
| 16  | Red & Blue    | Red ↔ blue gradient          |
| 17  | Yellowout     | Yellow fading to black       |
| 18  | Analogous     | Analogous warm colors        |
| 19  | Splash        | Bright splashes              |
| 20  | Pastel        | Soft pastel tones            |
| 21  | Sunset 2      | Alternate sunset             |
| 22  | Beach         | Sand and ocean colors        |
| 23  | Vintage       | Muted retro tones            |
| 24  | Departure     | Warm transitions             |
| 25  | Landscape     | Green → cyan → purple        |
| 26  | Beech         | Earth tones                  |
| 27  | Sherbet       | Rainbow sherbet colors       |
| 28  | Hult          | Nature greens                |
| 29  | Hult 64       | Expanded Hult                |
| 30  | Drywet        | Desert to water              |
| 31  | Jul           | Christmas red/green          |
| 32  | Grintage      | Gray vintage                 |
| 33  | Rewhi         | Red → white                  |
| 34  | Tertiary      | Three color blend            |
| 35  | Fire          | Black → red → yellow → white |
| 36  | Icefire       | Blue ice → orange fire       |
| 37  | Cyane         | Cyan variations              |
| 38  | Light Pink    | Soft pinks                   |
| 39  | Autumn        | Fall reds/oranges/yellows    |
| 40  | Magenta       | Magenta shades               |
| 41  | Magred        | Magenta → red                |
| 42  | Yelmag        | Yellow → magenta             |
| 43  | Yelblu        | Yellow → blue                |
| 44  | Orange & Teal | Complementary pair           |
| 45  | Tiamat        | Fantasy blues/purples        |
| 46  | April Night   | Dark blues                   |
| 47  | Orangery      | Orange variations            |
| 48  | C9            | Classic C9 Christmas lights  |
| 49  | Sakura        | Cherry blossom pinks         |
| 50  | Aurora        | Northern lights green → blue |
| 51  | Atlantica     | Ocean blues and greens       |
| 52  | C9 2          | C9 variant                   |
| 53  | C9 New        | C9 modern                    |
| 54  | Temperature   | Blue (cold) → red (hot)      |
| 55  | Aurora 2      | Alternate aurora             |
| 56  | Retro Clown   | Circus colors                |
| 57  | Candy         | Sweet colors                 |
| 58  | Toxy Reaf     | Toxic green reef             |
| 59  | Fairy Reaf    | Ethereal reef                |
| 60  | Semi Blue     | Blue tones                   |
| 61  | Pink Candy    | Pink sweet tones             |
| 62  | Red Reaf      | Red reef                     |
| 63  | Aqua Flash    | Aqua highlight               |
| 64  | Yelblu Hot    | Hot yellow-blue              |
| 65  | Lite Light    | Light pastel                 |
| 66  | Red Flash     | Red highlight                |
| 67  | Blink Red     | Red blink variant            |
| 68  | Red Shift     | Shifting reds                |
| 69  | Red Tide      | Red ocean                    |
| 70  | Candy2        | Candy variant                |
| 71  | Traffic Light | Red → yellow → green         |

#### 3.7.4 Palette Color Retrieval

When an effect calls `color_from_palette(index, mapping, moving, colorSlot, brightness)`:

```typescript
function colorFromPalette(
  index: number, // 0–255 palette position
  mapping: boolean, // true = map LED position to 0–255
  moving: boolean, // affects blend wrapping mode
  colorSlot: number, // which color slot for fallback
  brightness: number, // 0–255
): Color {
  // If palette == 0 (Default), return the segment color slot faded
  if (palette === 0) {
    return colorFade(segmentColors[colorSlot], brightness)
  }

  let paletteIndex = index
  if (mapping) {
    // Map LED position proportionally to 0–255
    paletteIndex = Math.min(Math.floor((index * 255) / virtualLength), 255)
  }

  // Sample from the current gradient palette
  const color = samplePalette(currentPalette, paletteIndex, brightness)
  return color
}
```

#### 3.7.5 FastLED Built-in Palettes

These 7 palettes (IDs 6–12) use CRGBPalette16 format — 16 evenly-spaced color entries:

| ID  | Name          | Colors (summarized)                    |
| --- | ------------- | -------------------------------------- |
| 6   | Party         | Purples, blues, pinks, reds, oranges   |
| 7   | Cloud         | Blues and whites                       |
| 8   | Lava          | Blacks, reds, oranges, yellows, whites |
| 9   | Ocean         | Dark blues, teals, light blues         |
| 10  | Forest        | Dark greens, greens, light greens      |
| 11  | Rainbow       | Full hue spectrum, evenly spaced       |
| 12  | Rainbow Bands | Full hue spectrum, sharper transitions |

---

## 4. JSON API Specification

### 4.1 State Object (Root Level)

This is the primary configuration object the preview app must parse:

```typescript
interface WLEDState {
  on: boolean // Power state
  bri: number // Global brightness (0–255)
  transition: number // Transition time in 100ms units (0–600)
  bs: number // Blend style (0–23)
  ps: number // Current preset ID (-1 = none)
  pl: number // Current playlist ID (-1 = none)
  ledmap: number // LED mapping preset
  mainseg: number // Main segment index
  lor: number // Live override (0=off, 1=override, 2=always)

  nl: {
    // Nightlight
    on: boolean
    dur: number // Minutes
    mode: number // 0=off, 1=fade, 2=stay, 3=custom
    tbri: number // Target brightness
    rem: number // Seconds remaining (-1 = inactive)
  }

  udpn: {
    // UDP sync (informational only for preview)
    send: boolean
    recv: boolean
    sgrp: number
    rgrp: number
  }

  seg: Segment[] // Segment array
}
```

### 4.2 Segment Object

```typescript
interface Segment {
  // Identity
  id: number // Segment ID (0-based)
  n?: string // Optional display name

  // Geometry (1D)
  start: number // First LED index
  stop: number // Last LED (exclusive)
  len?: number // Calculated: stop - start
  grp: number // Grouping: pixels per group (default 1)
  spc: number // Spacing: gap between groups (default 0)
  of: number // Offset: LED shift

  // Geometry (2D)
  startY?: number // Y start coordinate
  stopY?: number // Y end coordinate

  // State
  on: boolean // Segment on/off
  frz: boolean // Freeze (pause animation)
  bri: number // Segment brightness (0–255)
  cct: number // Color temperature (0–255)

  // Colors
  col: Color[] // 3 color slots [primary, secondary, tertiary]
  // Each: [R,G,B] or [R,G,B,W] or hex string

  // Effect
  fx: number // Effect mode ID (0–218)
  sx: number // Speed (0–255)
  ix: number // Intensity (0–255)
  pal: number // Palette ID (0–71)

  // Custom parameters
  c1: number // Custom param 1 (0–255)
  c2: number // Custom param 2 (0–255)
  c3: number // Custom param 3 (0–31)
  o1: boolean // Option flag 1
  o2: boolean // Option flag 2
  o3: boolean // Option flag 3

  // Modifiers
  sel: boolean // Selected in UI
  rev: boolean // Reverse direction
  mi: boolean // Mirror
  rY?: boolean // Reverse Y (2D)
  mY?: boolean // Mirror Y (2D)
  tp?: boolean // Transpose X↔Y (2D)

  // Blending
  bm: number // Blend mode (0–15)
  si: number // Sound simulation (0–3)
  m12: number // 1D→2D mapping mode (0–4)
  set: number // Effect set mode (0–3)

  // Individual pixel control (optional)
  i?: (number | number[])[] // [index, [R,G,B], index, [R,G,B], ...]
}
```

### 4.3 Virtual Length Calculation

The preview app must compute virtual segment length to match WLED's effect rendering:

```typescript
function virtualLength(segment: Segment): number {
  const physicalLength = segment.stop - segment.start
  const groupLen = segment.grp + segment.spc // e.g., grp=3, spc=1 → groupLen=4
  let vLen = Math.ceil(physicalLength / groupLen)

  if (segment.mi) {
    // Mirror halves the virtual length
    vLen = Math.ceil(vLen / 2)
  }
  return vLen
}
```

**Examples:**

| Physical LEDs | Grouping | Spacing | Mirror | Virtual Length |
| ------------- | -------- | ------- | ------ | -------------- |
| 60            | 1        | 0       | No     | 60             |
| 60            | 1        | 0       | Yes    | 30             |
| 60            | 3        | 0       | No     | 20             |
| 60            | 3        | 1       | No     | 15             |
| 60            | 3        | 1       | Yes    | 8              |

### 4.4 Blend Modes (Segment Blending)

When segments overlap, their pixels are combined using one of 16 blend modes:

| ID  | Mode       | Formula                                                                      |
| --- | ---------- | ---------------------------------------------------------------------------- |
| 0   | Top        | `a` (segment on top, full opacity)                                           |
| 1   | Bottom     | `b` (segment on bottom)                                                      |
| 2   | Add        | `min(a + b, 255)`                                                            |
| 3   | Subtract   | `max(a - b, 0)`                                                              |
| 4   | Difference | `abs(a - b)`                                                                 |
| 5   | Average    | `(a + b) / 2`                                                                |
| 6   | Multiply   | `(a * b) / 255`                                                              |
| 7   | Divide     | `min((a * 256) / (b + 1), 255)`                                              |
| 8   | Lighten    | `max(a, b)`                                                                  |
| 9   | Darken     | `min(a, b)`                                                                  |
| 10  | Screen     | `255 - ((255 - a) * (255 - b)) / 255`                                        |
| 11  | Overlay    | If `a < 128`: `(2 * a * b) / 255` else `255 - (2 * (255-a) * (255-b)) / 255` |
| 12  | Hard Light | If `b < 128`: `(2 * a * b) / 255` else `255 - (2 * (255-a) * (255-b)) / 255` |
| 13  | Soft Light | Pegtop: `((255 - 2*b) * a*a / 255 + 2*b*a) / 255`                            |
| 14  | Dodge      | `min((a * 256) / (256 - b), 255)`                                            |
| 15  | Burn       | `max(255 - ((255 - a) * 256) / (b + 1), 0)`                                  |

Applied per-channel (R, G, B, W independently).

### 4.5 Blend Styles (Transition Effects)

When transitioning between effects, palettes, or presets, WLED uses visual transition animations:

| ID  | Name         | Type      | Description                                  |
| --- | ------------ | --------- | -------------------------------------------- |
| 0   | Fade         | Universal | Cross-fade (alpha blend between old and new) |
| 1   | Fairy Dust   | Universal | Random pixels transition individually        |
| 2   | Swipe Right  | 1D/2D     | Wipe from left to right                      |
| 3   | Swipe Left   | 1D/2D     | Wipe from right to left                      |
| 4   | Outside In   | 1D/2D     | Wipe from both edges toward center           |
| 5   | Inside Out   | 1D/2D     | Wipe from center toward edges                |
| 6   | Swipe Up     | 2D        | Wipe from bottom to top                      |
| 7   | Swipe Down   | 2D        | Wipe from top to bottom                      |
| 8   | Open H       | 2D        | Horizontal open (curtain)                    |
| 9   | Open V       | 2D        | Vertical open (curtain)                      |
| 10  | Swipe TL     | 2D        | Diagonal from top-left                       |
| 11  | Swipe TR     | 2D        | Diagonal from top-right                      |
| 12  | Swipe BR     | 2D        | Diagonal from bottom-right                   |
| 13  | Swipe BL     | 2D        | Diagonal from bottom-left                    |
| 14  | Circular Out | 2D        | Expanding circle from center                 |
| 15  | Circular In  | 2D        | Shrinking circle to center                   |
| 16  | Push Right   | 1D/2D     | Scroll new content in from left              |
| 17  | Push Left    | 1D/2D     | Scroll new content in from right             |
| 18  | Push Up      | 2D        | Scroll new content in from bottom            |
| 19  | Push Down    | 2D        | Scroll new content in from top               |
| 20  | Push TL      | 2D        | Scroll diagonally from bottom-right          |
| 21  | Push TR      | 2D        | Scroll diagonally from bottom-left           |
| 22  | Push BR      | 2D        | Scroll diagonally from top-left              |
| 23  | Push BL      | 2D        | Scroll diagonally from top-right             |

### 4.6 Preset File Format

Preset files (`presets.json`) contain a JSON object with numeric keys:

```json
{
  "0": {},
  "1": {
    "n": "Warm Evening",
    "on": true,
    "bri": 200,
    "transition": 50,
    "seg": [
      {
        "id": 0,
        "start": 0,
        "stop": 60,
        "fx": 66,
        "sx": 128,
        "ix": 200,
        "pal": 35,
        "col": [
          [255, 147, 41],
          [0, 0, 0],
          [0, 0, 0]
        ]
      }
    ]
  },
  "2": {
    "n": "Ocean Breeze",
    "on": true,
    "bri": 180,
    "seg": [
      {
        "fx": 101,
        "col": [
          [0, 120, 200],
          [0, 50, 100],
          [0, 200, 255]
        ]
      }
    ]
  }
}
```

- Key `"0"` is a required placeholder (always empty object)
- Keys `"1"` through `"250"` are user presets
- Each preset contains a partial or full state object
- The `"n"` field is the preset name
- Optional: `"ql"` field for quick-load button string (`"1~3~5"`)
- Optional: `"win"` field for HTTP API command string (alternative to state)

### 4.7 Playlist Format

```json
{
  "playlist": {
    "ps": [1, 2, 5, 3],
    "dur": [50, 50, 100, 50],
    "transition": [7, 7, 7, 7],
    "repeat": 0,
    "end": 0
  }
}
```

| Field        | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| `ps`         | number[] | Preset IDs to cycle through               |
| `dur`        | number[] | Duration for each preset (in 100ms units) |
| `transition` | number[] | Transition time per step (in 100ms units) |
| `repeat`     | number   | 0 = infinite loop, 1+ = repeat count      |
| `end`        | number   | Preset ID to apply when playlist finishes |

### 4.8 Info Object (Device Metadata)

Available at `/json/info`, useful for configuring the preview canvas:

```typescript
interface WLEDInfo {
  ver: string // Firmware version (e.g., "0.15.0")
  leds: {
    count: number // Total LED count
    pwr: number // Current power draw (mA)
    fps: number // Current frame rate
    maxpwr: number // Power budget (mA)
    maxseg: number // Max segments supported
    lc: number // Light capabilities bitfield
    matrix?: {
      w: number // Matrix width
      h: number // Matrix height
    }
  }
  name: string // Device name
  arch: string // "esp32" or "esp8266"
  fxcount: number // Number of available effects
  palcount: number // Number of built-in palettes
}
```

**Light Capabilities Bitfield (`lc`):**

| Bit | Value | Capability                      |
| --- | ----- | ------------------------------- |
| 0   | 0x01  | RGB color                       |
| 1   | 0x02  | White channel                   |
| 2   | 0x04  | CCT (color temperature control) |

Examples: `lc=1` → RGB only, `lc=3` → RGBW, `lc=7` → RGBW+CCT

### 4.9 1D→2D Mapping Modes

When a 1D effect runs on a 2D matrix, LEDs are mapped using:

| ID  | Mode     | Description                                          |
| --- | -------- | ---------------------------------------------------- |
| 0   | Pixels   | Direct 1D mapping (zigzag across rows)               |
| 1   | Bar      | Expand vertically (each virtual pixel = full column) |
| 2   | Arc      | Circular mapping from center                         |
| 3   | Corner   | Rectangular distance from corner                     |
| 4   | Pinwheel | Radial mapping (angle-based)                         |

### 4.10 Sound Simulation Modes

For audio-reactive effects without actual audio input:

| ID  | Name          | Description                     |
| --- | ------------- | ------------------------------- |
| 0   | BeatSin       | Sine-wave simulated beat        |
| 1   | WeWillRockYou | Rhythmic boom-boom-clap pattern |
| 2   | 10/13         | Custom ratio pattern            |
| 3   | 14/3          | Custom ratio pattern            |

These generate synthetic FFT and volume data for effects that normally require a microphone.

---

## 5. Application Architecture

### 5.1 Component Hierarchy

```
<App>
├── <FileLoader />              // JSON file picker and preset selector
├── <ConfigPanel />             // Display current config, adjust params
│   ├── <GlobalControls />      // Brightness, power, transition
│   └── <SegmentEditor />       // Per-segment controls
├── <LEDCanvas />               // Main preview renderer
│   ├── <Strip1D />             // Linear LED strip visualization
│   └── <Matrix2D />            // Grid LED matrix visualization
├── <EffectEngine />            // Frame loop and effect execution
│   ├── <SegmentRenderer />     // Per-segment effect processor
│   └── <PaletteManager />      // Palette data and sampling
└── <PlaylistRunner />          // Playlist timing and preset cycling
```

### 5.2 Core Data Flow

```
JSON File → Parser → State Store → Effect Engine → Pixel Buffer → Canvas Renderer
                         ↑                                              |
                    User Controls ←─────── Visual Feedback ─────────────┘
```

1. **Parser**: Validates and normalizes JSON input (handles all color formats)
2. **State Store**: Holds current WLED state (React context or Zustand/Redux)
3. **Effect Engine**: Runs at target FPS using `requestAnimationFrame`
4. **Pixel Buffer**: `Uint32Array` of RGBW values for total LED count
5. **Canvas Renderer**: Draws pixels to `<canvas>` or CSS grid

### 5.3 State Management

```typescript
interface PreviewState {
  // Global
  on: boolean
  brightness: number // 0–255
  totalLEDs: number // Total physical LED count
  matrixWidth?: number // 2D width (if matrix)
  matrixHeight?: number // 2D height (if matrix)
  fps: number // Target FPS (default 42)

  // Time
  startTime: number // Performance.now() at start
  frameCount: number // Global frame counter

  // Segments
  segments: SegmentState[]

  // Pixel output
  pixelBuffer: Uint32Array // Final LED colors
}

interface SegmentState {
  config: Segment // From JSON
  virtualLength: number // Computed
  effectState: {
    // Per-segment animation state
    call: number
    step: number
    aux0: number
    aux1: number
    data: Uint8Array | null // Effect-specific buffer (e.g., heat[] for Fire)
  }
  pixelBuffer: Uint32Array // Segment's local pixel buffer
}
```

### 5.4 Rendering Approaches

#### Option A: HTML5 Canvas (Recommended for 1D)

```typescript
function renderStrip(ctx: CanvasRenderingContext2D, pixels: Uint32Array) {
  const ledSize = Math.floor(canvas.width / pixels.length)
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i]
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(i * ledSize, 0, ledSize - 1, ledSize) // Gap between LEDs
  }
}
```

#### Option B: CSS Grid (Alternative for small LED counts)

```tsx
<div
  className="led-strip"
  style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)` }}
>
  {pixels.map((color, i) => (
    <div
      key={i}
      className="led"
      style={{
        backgroundColor: `rgb(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff})`,
        borderRadius: '50%',
      }}
    />
  ))}
</div>
```

#### Option C: WebGL (Recommended for 2D matrices and large counts)

For 2D matrices or strips with >500 LEDs, use WebGL texture rendering for performance.

### 5.5 Effect Engine Loop

```typescript
class EffectEngine {
  private now: number = 0
  private frameTime: number
  private animationId: number = 0

  constructor(fps: number = 42) {
    this.frameTime = 1000 / fps
  }

  start() {
    const loop = (timestamp: number) => {
      this.now = timestamp
      for (const segment of this.segments) {
        if (!segment.config.on || segment.config.frz) continue
        this.runEffect(segment)
        segment.effectState.call++
      }
      this.compositeSegments() // Blend overlapping segments
      this.applyGlobalBrightness()
      this.render()
      this.animationId = requestAnimationFrame(loop)
    }
    this.animationId = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.animationId)
  }
}
```

---

## 6. Implementation Details

### 6.1 Priority Effects to Implement

Start with these effects which cover the most common use cases and the core algorithm types:

| Priority | Effect         | ID  | Algorithm Type          |
| -------- | -------------- | --- | ----------------------- |
| P0       | Solid          | 0   | Fill                    |
| P0       | Blink          | 1   | Time-based toggle       |
| P0       | Breathe        | 2   | Sine wave               |
| P0       | Color Wipe     | 3   | Progressive fill        |
| P0       | Rainbow Cycle  | 9   | Color wheel             |
| P0       | Chase          | 28  | Moving block            |
| P0       | Fire 2012      | 66  | Cellular automaton      |
| P1       | Twinkle        | 17  | Random activation       |
| P1       | Meteor         | 76  | Trailing head           |
| P1       | Ripple         | 79  | Wave propagation        |
| P1       | Palette        | 65  | Palette sweep           |
| P1       | Sparkle        | 20  | Random flash            |
| P1       | Scan           | 10  | Bouncing position       |
| P1       | Theater Chase  | 13  | Pattern march           |
| P2       | Aurora         | 38  | Multi-wave color        |
| P2       | Running Lights | 15  | Sine wave per pixel     |
| P2       | Pacifica       | 101 | Multi-layer waves       |
| P2       | Candle         | 88  | Random flicker          |
| P2       | Bouncing Balls | 91  | Physics simulation      |
| P2       | Gradient       | 46  | Position-mapped palette |

### 6.2 Utility Functions Required

```typescript
// Color manipulation
function colorBlend(c1: number, c2: number, blend: number): number
function colorFade(c: number, amount: number, video?: boolean): number
function colorWheel(pos: number): number
function hexToColor(hex: string): number
function rgbArrayToColor(arr: number[]): number
function kelvinToRgb(kelvin: number): number

// Palette
function samplePalette(palette: GradientStop[], index: number, brightness: number): number
function colorFromPalette(segState: SegmentState, index: number, mapping: boolean): number

// Math helpers
function sin16(theta: number): number // 16-bit sine (0-65535 input → -32768 to 32767)
function triwave8(x: number): number // Triangle wave (0-255 → 0-255-0)
function cubicwave8(x: number): number // Cubic wave (smoother sine approximation)
function scale8(value: number, scale: number): number // (value * scale) >> 8
function qadd8(a: number, b: number): number // Saturating add (clamp to 255)
function qsub8(a: number, b: number): number // Saturating subtract (clamp to 0)
function lerp8by8(a: number, b: number, frac: number): number

// PRNG
function pseudoRandom16(seed: number): number // LCG: seed * 2053 + 13849
```

### 6.3 Segment Rendering Pipeline

For each segment, each frame:

```
1. Compute virtual length (accounting for grouping, spacing, mirror)
2. Run effect function → writes to virtual pixel buffer[0..vLen-1]
3. Expand virtual → physical pixels (apply grouping)
   - Each virtual pixel fills `grp` physical pixels
   - Skip `spc` physical pixels between groups
4. Apply mirror (if enabled): reflect first half to second half
5. Apply reverse (if enabled): reverse pixel order
6. Apply offset: rotate pixel positions by `of` LEDs
7. Apply segment brightness: scale all pixels by `bri/255`
8. Write to global pixel buffer at segment's start..stop range
```

### 6.4 Grouping and Spacing Expansion

```typescript
function expandVirtualToPhysical(
  virtualPixels: Uint32Array,
  grp: number,
  spc: number,
  physicalLength: number,
): Uint32Array {
  const physical = new Uint32Array(physicalLength)
  let physIdx = 0
  for (let v = 0; v < virtualPixels.length && physIdx < physicalLength; v++) {
    // Fill `grp` physical pixels with the virtual pixel's color
    for (let g = 0; g < grp && physIdx < physicalLength; g++) {
      physical[physIdx++] = virtualPixels[v]
    }
    // Skip `spc` physical pixels (leave as black/0)
    physIdx += spc
  }
  return physical
}
```

### 6.5 Handling Presets and Playlists

#### Loading a Preset File

```typescript
function loadPresetFile(json: Record<string, any>): Preset[] {
  return Object.entries(json)
    .filter(([key]) => key !== '0' && !isNaN(Number(key)))
    .map(([key, value]) => ({
      id: Number(key),
      name: value.n || `Preset ${key}`,
      state: normalizeState(value),
    }))
}
```

#### Running a Playlist

```typescript
class PlaylistRunner {
  private presets: number[]
  private durations: number[] // in 100ms units
  private currentIndex: number = 0
  private timer: number = 0

  tick(deltaMs: number) {
    this.timer += deltaMs
    const durationMs = this.durations[this.currentIndex] * 100
    if (this.timer >= durationMs) {
      this.timer -= durationMs
      this.currentIndex = (this.currentIndex + 1) % this.presets.length
      this.applyPreset(this.presets[this.currentIndex])
    }
  }
}
```

### 6.6 File Input Handling

The app should accept JSON files via:

1. **File picker**: `<input type="file" accept=".json" />`
2. **Drag and drop**: Drop zone on the main canvas
3. **Paste**: Ctrl+V JSON text
4. **URL parameter**: `?config=base64encodedJSON` (for sharing)

### 6.7 Configuration Panel

The UI should display and allow editing of:

| Section     | Controls                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Global      | Power toggle, brightness slider, FPS input, total LED count                                                                               |
| Per-Segment | Start/stop, effect dropdown, speed/intensity sliders, color pickers (3 slots), palette dropdown, grouping/spacing, mirror/reverse toggles |
| Preset      | Preset list with load buttons, playlist player with play/pause/skip                                                                       |
| Display     | 1D/2D toggle, LED size, gap between LEDs, background color, glow effect toggle                                                            |

### 6.8 LED Visual Representation

For realistic appearance:

```css
.led {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  /* Glow effect for active LEDs */
  box-shadow: 0 0 4px 2px currentColor;
  /* Dim LEDs should not glow */
  transition: background-color 16ms linear;
}
```

Consider adding:

- **Glow**: CSS `box-shadow` or canvas radial gradient simulating LED light bleed
- **Strip housing**: Gray background behind LEDs to simulate a strip PCB
- **Physical spacing**: Configurable pixel pitch (e.g., 30 LEDs/m, 60 LEDs/m)

### 6.9 Performance Considerations

| Concern                  | Mitigation                                                              |
| ------------------------ | ----------------------------------------------------------------------- |
| Large LED counts (>1000) | Use Canvas or WebGL instead of DOM elements                             |
| Effect computation       | Use `Uint32Array` for pixel buffers; avoid object allocations per frame |
| Palette sampling         | Pre-compute 256-entry LUT per palette at load time                      |
| Frame rate               | Use `requestAnimationFrame`; skip frames if computation exceeds budget  |
| Memory                   | Reuse typed arrays; pool effect data buffers                            |

### 6.10 Testing Strategy

| Test Type   | Coverage                                                                                |
| ----------- | --------------------------------------------------------------------------------------- |
| Unit        | Color utilities (blend, fade, wheel, HSV), palette sampling, virtual length calculation |
| Integration | JSON parsing (all 5 color formats), preset loading, playlist sequencing                 |
| Visual      | Snapshot tests for Solid, Rainbow, Chase at known parameters                            |
| Performance | FPS measurement at 60, 300, 1000 LEDs                                                   |

---

## Appendix A: Quick Reference

### Minimal JSON to Get Started

```json
{
  "on": true,
  "bri": 128,
  "seg": [
    {
      "start": 0,
      "stop": 60,
      "col": [
        [255, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ],
      "fx": 9,
      "sx": 128,
      "ix": 128,
      "pal": 11
    }
  ]
}
```

This renders 60 LEDs with the Rainbow Cycle effect at medium speed using the Rainbow palette.

### Preset File Example

```json
{
  "0": {},
  "1": {
    "n": "Warm Fire",
    "on": true,
    "bri": 200,
    "seg": [
      {
        "start": 0,
        "stop": 60,
        "fx": 66,
        "sx": 100,
        "ix": 180,
        "pal": 35,
        "col": [
          [255, 147, 41],
          [0, 0, 0],
          [0, 0, 0]
        ]
      }
    ]
  },
  "2": {
    "n": "Cool Ocean",
    "on": true,
    "bri": 150,
    "seg": [
      {
        "start": 0,
        "stop": 60,
        "fx": 101,
        "col": [
          [0, 105, 148],
          [0, 50, 80],
          [0, 180, 220]
        ]
      }
    ]
  },
  "3": {
    "n": "Party Rainbow",
    "on": true,
    "bri": 255,
    "seg": [
      {
        "start": 0,
        "stop": 30,
        "fx": 9,
        "sx": 200,
        "ix": 128,
        "pal": 11
      },
      {
        "start": 30,
        "stop": 60,
        "fx": 28,
        "sx": 150,
        "ix": 100,
        "pal": 6,
        "col": [
          [255, 0, 128],
          [0, 255, 64],
          [64, 0, 255]
        ]
      }
    ]
  }
}
```

### Playlist Example

```json
{
  "playlist": {
    "ps": [1, 2, 3],
    "dur": [100, 100, 100],
    "transition": [7, 7, 7],
    "repeat": 0,
    "end": 0
  }
}
```

This cycles through presets 1, 2, 3 (10 seconds each) with 0.7-second transitions, looping forever.
