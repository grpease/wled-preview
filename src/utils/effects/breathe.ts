import type { EffectFn } from '../../types/wled'
import { colorFade } from '../colorUtils'

/**
 * Effect 2: Breathe — sine-wave brightness pulsing on the primary color.
 * Effect 105: Heartbeat — faster version using same algorithm.
 * FR-008.
 */
export const breathe: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const speedFactor = 0.5 + (segment.sx / 255) * 4.5 // 0.5–5.0 cycles/sec
  const angle = (now / 1000) * speedFactor * Math.PI * 2
  // Sine oscillates -1..1; map to 0.05..1.0 brightness
  const brightness = Math.round((0.5 + 0.45 * Math.sin(angle)) * 255)
  const color = colorFade(segment.colors[0], brightness)
  return Array.from({ length: len }, () => color)
}
