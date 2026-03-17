import type { EffectFn, RgbwColor } from '../../types/wled'
import { sampleGradientPalette } from '../palettes'
import { GRADIENT_PALETTES } from '../palettes/gradientData'

interface FireData {
  heat: number[]
  seed: number
}

// Simple xorshift PRNG
function xorshift(s: number): number {
  s ^= s << 13
  s ^= s >> 17
  s ^= s << 5
  return (s >>> 0) & 0xffffffff
}

/**
 * Effect 66: Fire 2012 — cellular automaton fire simulation.
 * Uses the Fire gradient palette (ID 35) for color mapping. FR-008.
 */
export const fire2012: EffectFn = (segment, state, _now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength

  if (state.data === null) {
    state.data = {
      heat: new Array<number>(len).fill(0),
      seed: (segment.id + 1) * 54321,
    } as FireData
  }

  const data = state.data as FireData
  const heat = data.heat

  // Ensure heat array matches current virtualLength
  while (heat.length < len) heat.push(0)

  const cooling = Math.round(55 + ((255 - segment.sx) / 255) * 100) // cooling: 55–155
  const sparking = Math.round(50 + (segment.ix / 255) * 180) // sparking: 50–230

  // Step 1: Cool every cell
  for (let i = 0; i < len; i++) {
    const coolAmt = Math.floor(Math.random() * ((cooling * 10) / len + 2))
    heat[i] = Math.max(0, heat[i] - coolAmt)
  }

  // Step 2: Heat diffuses up
  for (let i = len - 1; i >= 2; i--) {
    heat[i] = Math.floor((heat[i - 1] + heat[i - 2] + heat[i - 2]) / 3)
  }

  // Step 3: Randomly ignite near the bottom
  if (Math.random() * 255 < sparking) {
    const y = Math.floor(Math.random() * Math.min(7, len))
    heat[y] = Math.min(255, heat[y] + Math.floor(Math.random() * 95) + 160)
  }

  // Update seed for next frame
  data.seed = xorshift(data.seed + state.call)

  // Step 4: Map heat to Fire palette
  const firePalette = GRADIENT_PALETTES[35]

  return heat.slice(0, len).map((h): RgbwColor => {
    if (!firePalette) return [0, 0, 0, 0]
    return sampleGradientPalette(firePalette, Math.min(255, h))
  })
}
