import { describe, it, expect } from 'vitest'
import { blendColors } from './blendModes'
import type { RgbwColor } from '../types/wled'

const RED: RgbwColor = [255, 0, 0, 0]
const BLUE: RgbwColor = [0, 0, 255, 0]
const WHITE: RgbwColor = [255, 255, 255, 0]
const BLACK: RgbwColor = [0, 0, 0, 0]
const GRAY: RgbwColor = [128, 128, 128, 0]

describe('blendColors', () => {
  it('mode 0 (Top): overlay replaces base', () => {
    expect(blendColors(RED, BLUE, 0)).toEqual(BLUE)
  })

  it('mode 2 (Add): per-channel sum capped at 255', () => {
    const result = blendColors(RED, BLUE, 2)
    expect(result[0]).toBe(255) // R: 255+0=255
    expect(result[2]).toBe(255) // B: 0+255=255
  })

  it('mode 2 (Add): caps at 255', () => {
    const result = blendColors(WHITE, WHITE, 2)
    expect(result[0]).toBe(255)
    expect(result[1]).toBe(255)
    expect(result[2]).toBe(255)
  })

  it('mode 3 (Subtract): per-channel difference floored at 0', () => {
    const result = blendColors(RED, BLUE, 3)
    expect(result[0]).toBe(255) // 255-0=255
    expect(result[2]).toBe(0) // 0-255=0 (clamped)
  })

  it('mode 4 (Multiply): full channels * zero = black', () => {
    const result = blendColors(RED, BLACK, 4)
    expect(result).toEqual(BLACK)
  })

  it('mode 4 (Multiply): full channels * full = full', () => {
    const result = blendColors(WHITE, WHITE, 4)
    expect(result[0]).toBe(255)
  })

  it('mode 11 (Difference): absolute difference', () => {
    const result = blendColors([200, 100, 50, 0], [100, 200, 100, 0], 11)
    expect(result[0]).toBe(100) // |200-100|
    expect(result[1]).toBe(100) // |100-200|
    expect(result[2]).toBe(50) // |50-100|
  })

  it('mode 13 (OR): bitwise or', () => {
    const result = blendColors(
      [0b10110000, 0, 0, 0] as RgbwColor,
      [0b01001111, 0, 0, 0] as RgbwColor,
      13,
    )
    expect(result[0]).toBe(0b11111111)
  })

  it('mode 14 (AND): bitwise and', () => {
    const result = blendColors(
      [0b11110000, 0, 0, 0] as RgbwColor,
      [0b10101010, 0, 0, 0] as RgbwColor,
      14,
    )
    expect(result[0]).toBe(0b10100000)
  })

  it('mode 15 (XOR): bitwise xor', () => {
    const result = blendColors(
      [0b11110000, 0, 0, 0] as RgbwColor,
      [0b10101010, 0, 0, 0] as RgbwColor,
      15,
    )
    expect(result[0]).toBe(0b01011010)
  })

  it('out-of-range mode falls back to mode 0 (Top)', () => {
    expect(blendColors(RED, BLUE, 999)).toEqual(BLUE)
  })

  it('mode 5 (Screen): brighter than either input', () => {
    const result = blendColors(GRAY, GRAY, 5)
    expect(result[0]).toBeGreaterThan(128)
  })

  it('all 16 modes produce channels in [0, 255]', () => {
    for (let mode = 0; mode <= 15; mode++) {
      const result = blendColors([200, 150, 100, 50], [100, 150, 200, 50], mode)
      expect(result.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})
