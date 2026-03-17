import type {
  RgbwColor,
  GradientPalette,
  PaletteSamplerFn,
  ResolvedSegment,
} from '../../types/wled'
import { colorFade } from '../colorUtils'
import { GRADIENT_PALETTES } from './gradientData'
import { FASTLED_PALETTES } from './fastledPalettes'

/**
 * Sample a gradient palette at position 0–255 using linear interpolation.
 * FR-013.
 */
export function sampleGradientPalette(palette: GradientPalette, position: number): RgbwColor {
  const p = Math.max(0, Math.min(255, position))
  // Find surrounding stops
  let a = palette[0]
  let b = palette[palette.length - 1]
  for (let i = 0; i < palette.length - 1; i++) {
    if (palette[i][0] <= p && palette[i + 1][0] >= p) {
      a = palette[i]
      b = palette[i + 1]
      break
    }
  }
  if (a[0] === b[0]) {
    return [a[1], a[2], a[3], 0]
  }
  const t = (p - a[0]) / (b[0] - a[0])
  return [
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
    0,
  ]
}

/**
 * Sample a FastLED palette (16 evenly-spaced entries) at position 0–255.
 */
export function sampleFastLEDPalette(
  palette: [number, number, number][],
  position: number,
): RgbwColor {
  const p = Math.max(0, Math.min(255, position))
  const scaled = (p / 255) * 15
  const i = Math.floor(scaled)
  const t = scaled - i
  const a = palette[i]
  const b = palette[(i + 1) % 16]
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    0,
  ]
}

/**
 * Create a PaletteSamplerFn pre-bound to a segment's palette ID and segment colors.
 * FR-014.
 */
export function createPaletteSampler(segment: ResolvedSegment): PaletteSamplerFn {
  const { pal, colors } = segment

  return (position: number, brightness: number, colorSlot: number = 0): RgbwColor => {
    let color: RgbwColor

    if (pal === 0) {
      // Default palette: use segment color slot
      color = colors[colorSlot] ?? ([0, 0, 0, 0] as RgbwColor)
    } else if (pal === 1) {
      // Random Cycle: deterministic fallback (use gradient palette ID 35 = Fire)
      color = sampleGradientPalette(GRADIENT_PALETTES[35], position)
    } else if (pal >= 2 && pal <= 5) {
      // Special palettes 2–5: use primary color with position-based brightness
      color = colors[0]
    } else if (pal >= 6 && pal <= 12) {
      const fl = FASTLED_PALETTES[pal]
      color = fl ? sampleFastLEDPalette(fl, position) : colors[0]
    } else if (pal >= 13 && pal <= 71) {
      const gp = GRADIENT_PALETTES[pal]
      color = gp ? sampleGradientPalette(gp, position) : colors[0]
    } else {
      // Out of range: use primary color
      color = colors[0]
    }

    return colorFade(color, brightness)
  }
}
