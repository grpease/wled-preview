import type { EffectFn, RgbwColor } from '../../types/wled'
import { colorWheel } from '../colorUtils'

const BLACK: RgbwColor = [0, 0, 0, 0]

interface RippleData {
  center: number
  startTime: number
  hue: number
}

/**
 * Effects 79 (Ripple) & 99 (Ripple Rainbow): wave propagation from a center point.
 * FR-008.
 */
export const ripple: EffectFn = (segment, state, now, _paletteSampler) => {
  state.call++
  const len = segment.virtualLength
  const isRainbow = segment.fx === 99

  if (state.data === null || now - (state.data as RippleData).startTime > 2000) {
    // Create a new ripple from a random center
    state.data = {
      center: Math.floor(Math.random() * len),
      startTime: now,
      hue: Math.floor(Math.random() * 256),
    } as RippleData
  }

  const data = state.data as RippleData
  const speedFactor = 0.5 + (segment.sx / 255) * 9.5
  const waveSpeed = speedFactor * len * 0.5 // pixels per second
  const elapsed = now - data.startTime
  const radius = (elapsed / 1000) * waveSpeed
  const width = 3 + Math.round((segment.ix / 255) * 10) // wave width

  const color = isRainbow ? colorWheel(data.hue) : segment.colors[0]

  return Array.from({ length: len }, (_, i) => {
    const dist = Math.abs(i - data.center)
    if (dist > radius + width || dist < radius - width) return BLACK
    // Fade based on distance from wave peak
    const distFromPeak = Math.abs(dist - radius)
    const bri = Math.round(255 * (1 - distFromPeak / width))
    if (bri <= 0) return BLACK
    const r = Math.round((color[0] * bri) / 255)
    const g = Math.round((color[1] * bri) / 255)
    const b = Math.round((color[2] * bri) / 255)
    return [r, g, b, 0] as RgbwColor
  })
}
