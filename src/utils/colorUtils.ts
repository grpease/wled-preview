import type { RgbwColor } from '../types/wled'

/**
 * Convert an RGBW color with two brightness levels to a CSS rgb() string.
 * The W (white) channel is added to each RGB channel before brightness scaling.
 *
 * @param col       - [R, G, B, W] values 0-255
 * @param segBri    - segment brightness 0-255
 * @param presetBri - preset master brightness 0-255
 */
export function rgbwToCss(col: RgbwColor, segBri: number, presetBri: number): string {
  const effectiveBri = (segBri / 255) * (presetBri / 255)
  const r = Math.round(Math.min(255, (col[0] ?? 0) + (col[3] ?? 0)) * effectiveBri)
  const g = Math.round(Math.min(255, (col[1] ?? 0) + (col[3] ?? 0)) * effectiveBri)
  const b = Math.round(Math.min(255, (col[2] ?? 0) + (col[3] ?? 0)) * effectiveBri)
  return `rgb(${r}, ${g}, ${b})`
}
