import type { EffectFn, RgbwColor } from '../../types/wled'

const BLACK: RgbwColor = [0, 0, 0, 0]

/**
 * Effect 1: Blink — alternates between primary and secondary colors.
 * Speed (sx) controls the blink rate. FR-008.
 */
export const blink: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  // Period in ms: lower sx = slower, higher sx = faster
  // At sx=128: ~1000ms full cycle. At sx=255: ~100ms. At sx=0: ~10000ms.
  const periodMs = Math.round(10000 / (1 + (segment.sx / 255) * 99))
  const phase = Math.floor(now / periodMs) % 2

  const color =
    phase === 0
      ? segment.colors[0]
      : segment.colors[1][0] + segment.colors[1][1] + segment.colors[1][2] > 0
        ? segment.colors[1]
        : BLACK
  return Array.from({ length: len }, () => color)
}
