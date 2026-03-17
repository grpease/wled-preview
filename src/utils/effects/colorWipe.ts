import type { EffectFn, RgbwColor } from '../../types/wled'

const BLACK: RgbwColor = [0, 0, 0, 0]

/**
 * Effects 3 & 6: Color Wipe / Color Sweep — progressively fills strip with primary color,
 * then clears back to black (or secondary color). FR-008.
 */
export const colorWipe: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  // Full cycle period: one fill + one clear
  const periodMs = Math.round(10000 / (0.5 + (segment.sx / 255) * 9.5))
  const halfPeriod = periodMs / 2
  const t = now % periodMs
  const fillCount =
    t < halfPeriod
      ? Math.floor((t / halfPeriod) * len)
      : len - Math.floor(((t - halfPeriod) / halfPeriod) * len)

  return Array.from({ length: len }, (_, i) => (i < fillCount ? segment.colors[0] : BLACK))
}
