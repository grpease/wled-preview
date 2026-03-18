import type { EffectFn, RgbwColor } from '../../types/wled'

const BLACK: RgbwColor = [0, 0, 0, 0]

/**
 * Effects 41 (Comet) & 76 (Meteor): a bright head with a fading trail.
 * FR-008.
 */
export const meteor: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const trailLength = Math.max(2, Math.round((segment.ix / 255) * len * 0.5))
  const speedFactor = 0.5 + (segment.sx / 255) * 9.5
  // Meteor head position cycles over the strip length
  const head = Math.floor((now / 1000) * speedFactor * len) % len

  return Array.from({ length: len }, (_, i) => {
    // Compute distance behind the head (wrap-around)
    const dist = (head - i + len) % len
    if (dist > trailLength) return BLACK

    // Brightness falls off linearly from head (full) to tail (0)
    const bri = Math.round(255 * (1 - dist / trailLength))
    const r = Math.round((segment.colors[0][0] * bri) / 255)
    const g = Math.round((segment.colors[0][1] * bri) / 255)
    const b = Math.round((segment.colors[0][2] * bri) / 255)
    return [r, g, b, 0] as RgbwColor
  })
}
