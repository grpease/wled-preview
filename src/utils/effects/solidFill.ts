import type { EffectFn } from '../../types/wled'

/**
 * Effect 0: Solid Fill — all LEDs display the primary color. FR-008.
 */
export const solidFill: EffectFn = (segment, state, _now, paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const result = Array.from({ length: len }, (_, i) => {
    const pos = Math.round((i / Math.max(len - 1, 1)) * 255)
    return paletteSampler(pos, 255, 0)
  })
  return result
}
