import type { EffectFn } from '../../types/wled'
import { colorWheel } from '../colorUtils'

/**
 * Effect 8: Colorloop — entire strip cycles through rainbow colors together (all same hue).
 * Effect 9: Rainbow Cycle — each LED has a distinct hue based on its position.
 * FR-008.
 */

export const colorloop: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const speedFactor = 0.2 + (segment.sx / 255) * 1.8 // 0.2–2.0 rotations/sec
  const hue = Math.round((now / 1000) * speedFactor * 255) & 0xff
  const color = colorWheel(hue)
  return Array.from({ length: len }, () => color)
}

export const rainbowCycle: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const speedFactor = 0.2 + (segment.sx / 255) * 1.8
  const offset = Math.round((now / 1000) * speedFactor * 255) & 0xff
  return Array.from({ length: len }, (_, i) => {
    const hue = (Math.round((i / len) * 255) + offset) & 0xff
    return colorWheel(hue)
  })
}
