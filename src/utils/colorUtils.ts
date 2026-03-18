import type { RgbwColor, ColorInput } from '../types/wled'

/**
 * Convert an RGBW color with two brightness levels to a CSS rgb() string.
 * The W (white) channel is added to each RGB channel before brightness scaling.
 *
 * @param col       - [R, G, B, W] values 0-255
 * @param segBri    - segment brightness 0-255
 * @param presetBri - preset master brightness 0-255
 */
export function rgbwToCss(col: RgbwColor, segBri: number, presetBri: number): string {
  const effectiveBri = (segBri / 255) * (presetBri / 255)
  const r = Math.round(Math.min(255, (col[0] ?? 0) + (col[3] ?? 0)) * effectiveBri)
  const g = Math.round(Math.min(255, (col[1] ?? 0) + (col[3] ?? 0)) * effectiveBri)
  const b = Math.round(Math.min(255, (col[2] ?? 0) + (col[3] ?? 0)) * effectiveBri)
  return `rgb(${r}, ${g}, ${b})`
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/**
 * Convert Kelvin color temperature to RGB using the Tanner Helland algorithm.
 * Input clamped to 1000K–40000K (full algorithm range).
 * FR-002.
 */
export function kelvinToRgb(kelvin: number): RgbwColor {
  const temp = clamp(kelvin, 1000, 40000) / 100

  let r: number
  if (temp <= 66) {
    r = 255
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
  }

  let g: number
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
  }

  let b: number
  if (temp >= 66) {
    b = 255
  } else if (temp <= 19) {
    b = 0
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307
  }

  return [
    Math.round(clamp(r, 0, 255)),
    Math.round(clamp(g, 0, 255)),
    Math.round(clamp(b, 0, 255)),
    0,
  ]
}

/**
 * Parse a WLED ColorInput into a concrete RgbwColor.
 * Random colors ("r") are resolved once at call time — the caller must store the result.
 * FR-001.
 */
export function parseColorInput(input: ColorInput): RgbwColor {
  if (Array.isArray(input)) {
    const [r = 0, g = 0, b = 0, w = 0] = input
    return [r, g, b, w]
  }
  if (typeof input === 'number') {
    return kelvinToRgb(input)
  }
  if (typeof input === 'string') {
    if (input === 'r') {
      // Random color — resolved once by caller at preset load time
      return [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        0,
      ]
    }
    // Hex string: RRGGBB or RRGGBBWW
    const hex = input.replace('#', '')
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        0,
      ]
    }
    if (hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(6, 8), 16),
      ]
    }
    return [0, 0, 0, 0]
  }
  if (typeof input === 'object' && input !== null) {
    return [input.r ?? 0, input.g ?? 0, input.b ?? 0, input.w ?? 0]
  }
  return [0, 0, 0, 0]
}

/**
 * Channel-wise linear blend between two RGBW colors.
 * factor=0 returns a, factor=255 returns b. FR-003.
 */
export function colorBlend(a: RgbwColor, b: RgbwColor, factor: number): RgbwColor {
  const f = clamp(factor, 0, 255) / 255
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
    Math.round(a[3] + (b[3] - a[3]) * f),
  ]
}

/**
 * Fade color by scaling all channels proportionally. FR-004.
 */
export function colorFade(col: RgbwColor, factor: number): RgbwColor {
  const f = clamp(factor, 0, 255) / 255
  return [
    Math.round(col[0] * f),
    Math.round(col[1] * f),
    Math.round(col[2] * f),
    Math.round(col[3] * f),
  ]
}

/**
 * Video fade variant — preserves minimum channel visibility (channels don't reach 0
 * until factor is 0). FR-004.
 */
export function videoColorFade(col: RgbwColor, factor: number): RgbwColor {
  if (factor === 0) return [0, 0, 0, 0]
  const f = clamp(factor, 0, 255) / 255
  return [
    Math.max(1, Math.round(col[0] * f)),
    Math.max(1, Math.round(col[1] * f)),
    Math.max(1, Math.round(col[2] * f)),
    Math.max(1, Math.round(col[3] * f)),
  ]
}

/**
 * Convert 16-bit HSV to RGB. Hue is 0–65535, saturation and value are 0–255. FR-005.
 */
export function hsv16ToRgb(hue16: number, sat: number, val: number): RgbwColor {
  const hue = (hue16 >> 8) & 0xff // reduce to 0–255
  const s = sat / 255
  const v = val / 255
  const h = (hue / 255) * 6
  const i = Math.floor(h)
  const f = h - i
  const p = v * (1 - s)
  const q = v * (1 - s * f)
  const t = v * (1 - s * (1 - f))

  let r: number, g: number, b: number
  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    default:
      r = v
      g = p
      b = q
      break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 0]
}

/**
 * Map 0–255 to a rainbow color (full color wheel). FR-005.
 */
export function colorWheel(pos: number): RgbwColor {
  return hsv16ToRgb(pos << 8, 255, 255)
}

/**
 * Apply gamma correction (default gamma 2.8) to a single 0–255 channel value. FR-006.
 */
export function applyGammaChannel(value: number, gamma: number): number {
  return Math.round(Math.pow(value / 255, gamma) * 255)
}

/**
 * Apply gamma correction to an entire RgbwColor. FR-006.
 */
export function applyGamma(col: RgbwColor, gamma: number = 2.8): RgbwColor {
  return [
    applyGammaChannel(col[0], gamma),
    applyGammaChannel(col[1], gamma),
    applyGammaChannel(col[2], gamma),
    applyGammaChannel(col[3], gamma),
  ]
}
