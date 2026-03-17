import type { RgbwColor } from '../types/wled'

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

type BlendFn = (base: RgbwColor, overlay: RgbwColor) => RgbwColor

function perChannel(
  base: RgbwColor,
  overlay: RgbwColor,
  fn: (b: number, o: number) => number,
): RgbwColor {
  return [
    fn(base[0], overlay[0]),
    fn(base[1], overlay[1]),
    fn(base[2], overlay[2]),
    fn(base[3], overlay[3]),
  ]
}

// All 16 WLED blend modes (FR-020)
const BLEND_MODES: BlendFn[] = [
  // 0: Top — overlay completely replaces base
  (_base, overlay) => overlay,

  // 1: Seamless — overlay replaces base (alias for Top in simple renderer)
  (_base, overlay) => overlay,

  // 2: Add — per-channel sum, capped at 255
  (base, overlay) => perChannel(base, overlay, (b, o) => clamp(b + o)),

  // 3: Subtract — per-channel difference, floored at 0
  (base, overlay) => perChannel(base, overlay, (b, o) => clamp(b - o)),

  // 4: Multiply — per-channel multiply normalized
  (base, overlay) => perChannel(base, overlay, (b, o) => clamp((b * o) / 255)),

  // 5: Screen — 255 - ((255-b)*(255-o)/255)
  (base, overlay) =>
    perChannel(base, overlay, (b, o) => clamp(255 - ((255 - b) * (255 - o)) / 255)),

  // 6: Overlay — combination of multiply and screen
  (base, overlay) =>
    perChannel(base, overlay, (b, o) => {
      if (b < 128) return clamp((2 * b * o) / 255)
      return clamp(255 - (2 * (255 - b) * (255 - o)) / 255)
    }),

  // 7: Dodge — lighten base using overlay
  (base, overlay) => perChannel(base, overlay, (b, o) => clamp((b * 255) / Math.max(1, 255 - o))),

  // 8: Burn — darken base using overlay
  (base, overlay) =>
    perChannel(base, overlay, (b, o) => clamp(255 - ((255 - b) * 255) / Math.max(1, o))),

  // 9: Hard Light — overlay controls multiply or screen
  (base, overlay) =>
    perChannel(base, overlay, (b, o) => {
      if (o < 128) return clamp((2 * b * o) / 255)
      return clamp(255 - (2 * (255 - b) * (255 - o)) / 255)
    }),

  // 10: Soft Light — gentle version of overlay
  (base, overlay) =>
    perChannel(base, overlay, (b, o) => {
      if (o < 128) return clamp(b - ((255 - 2 * o) * b * (255 - b)) / (255 * 255))
      return clamp(b + ((2 * o - 255) * (Math.sqrt(b / 255) * 255 - b)) / 255)
    }),

  // 11: Difference — absolute difference per channel
  (base, overlay) => perChannel(base, overlay, (b, o) => clamp(Math.abs(b - o))),

  // 12: Exclusion — difference with less contrast
  (base, overlay) => perChannel(base, overlay, (b, o) => clamp(b + o - (2 * b * o) / 255)),

  // 13: OR — bitwise OR
  (base, overlay) => perChannel(base, overlay, (b, o) => (b | o) & 0xff),

  // 14: AND — bitwise AND
  (base, overlay) => perChannel(base, overlay, (b, o) => b & o & 0xff),

  // 15: XOR — bitwise XOR
  (base, overlay) => perChannel(base, overlay, (b, o) => (b ^ o) & 0xff),
]

/**
 * Apply a blend mode to composite an overlay color onto a base color.
 * mode must be 0–15; out-of-range values fall back to mode 0 (Top).
 */
export function blendColors(base: RgbwColor, overlay: RgbwColor, mode: number): RgbwColor {
  const fn = BLEND_MODES[mode] ?? BLEND_MODES[0]
  return fn(base, overlay)
}
