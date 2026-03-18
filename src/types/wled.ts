// WLED RGBW color: [Red, Green, Blue, White] each 0-255
export type RgbwColor = [number, number, number, number]

// Raw color input from JSON — one of five WLED formats
export type ColorInput =
  | [number, number, number] // RGB array
  | [number, number, number, number] // RGBW array
  | string // hex "RRGGBB"/"RRGGBBWW" or "r" for random
  | number // Kelvin temperature (1000–40000, clamped)
  | { r?: number; g?: number; b?: number; w?: number } // named channels

export interface Segment {
  id: number
  n?: string
  start: number
  // stop === 0 means inactive stub — skip when rendering
  stop: number
  grp?: number
  spc?: number
  of?: number
  on: boolean
  frz?: boolean
  bri: number
  cct?: number
  set?: number
  // col[0] = primary, col[1] = secondary, col[2] = tertiary; missing entries default to [0,0,0,0]
  col: ColorInput[]
  fx: number
  sx?: number
  ix?: number
  pal?: number
  c1?: number
  c2?: number
  c3?: number
  sel?: boolean
  rev?: boolean
  mi?: boolean
  o1?: boolean
  o2?: boolean
  o3?: boolean
  bm?: number
  si?: number
  m12?: number
}

// Segment with all defaults applied and colors resolved to RgbwColor
export interface ResolvedSegment {
  id: number
  start: number
  stop: number
  virtualLength: number
  on: boolean
  bri: number // 0–255
  colors: [RgbwColor, RgbwColor, RgbwColor] // exactly 3 slots, all resolved
  fx: number
  sx: number // speed 0–255
  ix: number // intensity 0–255
  pal: number // palette ID 0–71
  c1: number
  c2: number
  c3: number
  o1: boolean
  o2: boolean
  o3: boolean
  rev: boolean
  mi: boolean
  frz: boolean
  bm: number // blend mode 0–15
}

// Per-segment mutable animation state — cleared on every preset load
export interface SegmentState {
  call: number // frame counter
  step: number // effect-specific state counter
  aux0: number // auxiliary variable 0 (0–65535)
  aux1: number // auxiliary variable 1 (0–65535)
  data: unknown // effect-specific persistent data (heat[], trail[], prng seed, etc.)
}

// Pre-bound palette sampler passed into effect functions
export type PaletteSamplerFn = (
  position: number, // 0–255 palette position
  brightness: number, // 0–255 brightness scaling
  colorSlot?: number, // fallback slot index (0=primary, 1=secondary, 2=tertiary)
) => RgbwColor

// Core effect algorithm signature — all effects implement this
export type EffectFn = (
  segment: ResolvedSegment, // read-only segment config + resolved colors
  state: SegmentState, // mutable per-frame state (modify in place)
  now: number, // milliseconds since animation start
  paletteSampler: PaletteSamplerFn,
) => RgbwColor[] // pixel array, length === segment.virtualLength

// Root WLED state JSON structure
export interface WLEDStateJSON {
  on: boolean
  bri: number
  transition?: number
  ps?: number
  pl?: number
  seg: Segment[]
}

export interface Preset {
  id: string
  n: string
  on: boolean
  bri: number
  transition: number
  mainseg: number
  seg: Segment[]
  pl?: number
}

// Top-level presets JSON: keys are numeric strings, values are Preset objects
export type PresetMap = Record<string, Preset>

// Playlist definition
export interface Playlist {
  ps: number[] // ordered preset ID array
  dur: number[] // duration per preset in 100ms units
  transition?: number[] // transition time per step in 100ms
  repeat?: number // repeat count (0 = infinite)
  end?: number // preset to show after playlist ends (-1 = none)
  r?: boolean // shuffle order
}

// Discriminated union returned by parseInput
export type ParseResult =
  | { type: 'presets'; presets: PresetMap }
  | { type: 'state'; state: WLEDStateJSON }
  | { type: 'playlist'; playlist: Playlist; presets: PresetMap }

// Display and animation options (held in React state at App level)
export interface AnimationOptions {
  gammaEnabled: boolean
  gammaCurve: number // gamma exponent (default: 2.8)
  targetFps: number // animation frame rate target (default: 42)
  brightnessOverride?: number // UI brightness slider 0–255 (overrides JSON bri)
}

// Gradient palette stop: [position 0–255, R, G, B]
export type GradientStop = [number, number, number, number]

// Gradient palette: array of stops sorted by position ascending (min 2 stops)
export type GradientPalette = GradientStop[]

// FastLED palette: 16 evenly-spaced [R, G, B] entries
export type FastLEDPalette = [number, number, number][]

export interface LedColor {
  index: number
  cssColor: string
  isOff: boolean
  effectId?: number
}

export interface LedGridCell {
  index: number
  row: number
  col: number
}
