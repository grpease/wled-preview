import type { Preset, LedColor, RgbwColor } from '../types/wled'
import { rgbwToCss } from './colorUtils'

const OFF_COLOR = 'rgb(0, 0, 0)'
const FALLBACK_COLOR: RgbwColor = [0, 0, 0, 0]

/**
 * Convert a WLED Preset into an array of LedColor objects, one per LED index
 * from 0 to max(active segment stop) - 1.
 *
 * - Segments with stop === 0 are inactive stubs and are skipped.
 * - If the preset is off, all LEDs render as off.
 * - If a segment is off, its LED range renders as off.
 * - Overlapping segments: last segment in array order wins.
 */
export function renderLeds(preset: Preset): LedColor[] {
  const activeSegments = preset.seg.filter((s) => s.stop > 0)
  if (activeSegments.length === 0) return []

  const totalLeds = Math.max(...activeSegments.map((s) => s.stop))
  const leds: LedColor[] = Array.from({ length: totalLeds }, (_, i) => ({
    index: i,
    cssColor: OFF_COLOR,
    isOff: true,
  }))

  if (!preset.on) return leds

  for (const seg of activeSegments) {
    if (seg.start >= seg.stop) continue

    const primaryColor = seg.col?.[0] ?? FALLBACK_COLOR
    const isSegOff = !seg.on

    for (let i = seg.start; i < seg.stop; i++) {
      if (i >= totalLeds) break
      if (isSegOff) {
        leds[i] = { index: i, cssColor: OFF_COLOR, isOff: true }
      } else {
        const cssColor = rgbwToCss(primaryColor, seg.bri ?? 255, preset.bri ?? 255)
        leds[i] = {
          index: i,
          cssColor,
          isOff: false,
          effectId: seg.fx !== 0 ? seg.fx : undefined,
        }
      }
    }
  }

  return leds
}
