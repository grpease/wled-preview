import type { EffectFn, RgbwColor } from '../../types/wled'
import { colorWheel } from '../colorUtils'

const BLACK: RgbwColor = [0, 0, 0, 0]

/**
 * Effects 13, 15, 28–33: Theater Chase / Running Lights / Chase variants.
 * A moving dot or group pattern runs across the strip. FR-008.
 */
export const chase: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const speedFactor = 0.5 + (segment.sx / 255) * 9.5
  const offset = Math.floor((now / 1000) * speedFactor * len) % len

  return Array.from({ length: len }, (_, i) => {
    const pos = (i + offset) % len
    // Every 3rd LED lit — classic theater chase pattern
    return pos % 3 === 0 ? segment.colors[0] : BLACK
  })
}

/**
 * Running Lights (effect 15): smooth sine-wave chase.
 */
export const runningLights: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const speedFactor = 0.5 + (segment.sx / 255) * 4.5
  const offset = (now / 1000) * speedFactor

  return Array.from({ length: len }, (_, i) => {
    const wave = Math.sin((i / len) * Math.PI * 2 - offset * Math.PI * 2)
    const bri = Math.round(((wave + 1) / 2) * 255)
    const r = Math.round((segment.colors[0][0] * bri) / 255)
    const g = Math.round((segment.colors[0][1] * bri) / 255)
    const b = Math.round((segment.colors[0][2] * bri) / 255)
    return [r, g, b, 0] as RgbwColor
  })
}

/**
 * Rainbow Chase (for chase variants IDs 28–33): rainbow-colored moving chase.
 */
export const rainbowChase: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const speedFactor = 0.5 + (segment.sx / 255) * 9.5
  const offset = Math.floor((now / 1000) * speedFactor * len) % len

  return Array.from({ length: len }, (_, i) => {
    const pos = (i + offset) % len
    if (pos % 3 !== 0) return BLACK
    const hue = Math.round((i / len) * 255) & 0xff
    return colorWheel(hue)
  })
}
