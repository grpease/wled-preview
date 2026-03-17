import type { EffectFn, RgbwColor } from '../../types/wled'

const BLACK: RgbwColor = [0, 0, 0, 0]

interface TwinkleData {
  seed: number
  brightness: number[]
  direction: number[]
}

// Simple deterministic pseudo-random number generator (xorshift32)
function prng(seed: number): number {
  let s = seed ^ (seed << 13)
  s ^= s >> 17
  s ^= s << 5
  return (s >>> 0) & 0xffffffff
}

/**
 * Effects 17 & 20: Twinkle / Sparkle — random LEDs activate and fade.
 * Uses internal PRNG seeded from state.data to ensure deterministic output. FR-008.
 */
export const twinkle: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength

  if (state.data === null) {
    // Initialize per-LED brightness state with PRNG seed derived from segment ID
    const seed = (segment.id + 1) * 12345
    const brightness = Array.from({ length: len }, (_, i) => {
      const s = prng(seed + i * 777)
      return s & 0x7f // random initial brightness 0–127
    })
    const direction = Array.from({ length: len }, () => 1)
    state.data = { seed, brightness, direction } as TwinkleData
  }

  const data = state.data as TwinkleData
  const speedFactor = 0.5 + (segment.sx / 255) * 4.5
  const intensityFactor = 1 + Math.round((segment.ix / 255) * 9)
  // How many frames between brightness updates
  const framesBetweenUpdates = Math.max(1, Math.round(10 / speedFactor))

  if (state.call % framesBetweenUpdates === 0) {
    for (let i = 0; i < len; i++) {
      data.brightness[i] += data.direction[i] * intensityFactor
      if (data.brightness[i] >= 255) {
        data.brightness[i] = 255
        data.direction[i] = -1
      } else if (data.brightness[i] <= 0) {
        data.brightness[i] = 0
        data.direction[i] = 1
        // Randomly delay re-activation using timestamp as entropy
        if ((prng(data.seed + i + now) & 0x3f) !== 0) {
          data.direction[i] = 0 // stay off for a bit
        }
      } else if (data.direction[i] === 0) {
        // Re-activate with probability based on frame
        if ((prng(data.seed + i + state.call) & 0x1f) === 0) {
          data.direction[i] = 1
        }
      }
    }
  }

  return Array.from({ length: len }, (_, i) => {
    const bri = data.brightness[i]
    if (bri === 0) return BLACK
    const r = Math.round((segment.colors[0][0] * bri) / 255)
    const g = Math.round((segment.colors[0][1] * bri) / 255)
    const b = Math.round((segment.colors[0][2] * bri) / 255)
    return [r, g, b, 0] as RgbwColor
  })
}
