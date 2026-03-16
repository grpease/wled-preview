// WLED RGBW color: [Red, Green, Blue, White] each 0-255
export type RgbwColor = [number, number, number, number]

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
  col: RgbwColor[]
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
  si?: number
  m12?: number
}

export interface Preset {
  id: string
  n: string
  on: boolean
  bri: number
  transition: number
  mainseg: number
  seg: Segment[]
}

// Top-level presets JSON: keys are numeric strings, values are Preset objects
export type PresetMap = Record<string, Preset>

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
