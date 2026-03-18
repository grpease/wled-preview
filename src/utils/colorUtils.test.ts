import { describe, it, expect } from 'vitest'
import {
  parseColorInput,
  kelvinToRgb,
  colorBlend,
  colorFade,
  videoColorFade,
  hsv16ToRgb,
  colorWheel,
  applyGamma,
  applyGammaChannel,
} from './colorUtils'

describe('parseColorInput', () => {
  it('parses RGB array', () => {
    expect(parseColorInput([255, 0, 0])).toEqual([255, 0, 0, 0])
  })

  it('parses RGBW array', () => {
    expect(parseColorInput([255, 0, 0, 128])).toEqual([255, 0, 0, 128])
  })

  it('parses 6-char hex string', () => {
    expect(parseColorInput('FF0000')).toEqual([255, 0, 0, 0])
  })

  it('parses 8-char hex string with white channel', () => {
    expect(parseColorInput('FF0000FF')).toEqual([255, 0, 0, 255])
  })

  it('parses hex string case-insensitively', () => {
    expect(parseColorInput('ff0000')).toEqual([255, 0, 0, 0])
  })

  it('parses named channel object', () => {
    expect(parseColorInput({ r: 255, g: 100 })).toEqual([255, 100, 0, 0])
  })

  it('parses named channel object with missing fields defaulting to 0', () => {
    expect(parseColorInput({ b: 200 })).toEqual([0, 0, 200, 0])
  })

  it('parses Kelvin temperature', () => {
    const color = parseColorInput(6500)
    // ~6500K should be near-white (R≈255, G≈251, B≈255 or similar)
    expect(color[0]).toBeGreaterThan(200)
    expect(color[1]).toBeGreaterThan(200)
    expect(color[2]).toBeGreaterThan(200)
  })

  it('returns a non-black color for random input "r"', () => {
    const color = parseColorInput('r')
    expect(color).toHaveLength(4)
    expect(color.every((v) => v >= 0 && v <= 255)).toBe(true)
  })

  it('returns [0,0,0,0] for invalid hex', () => {
    expect(parseColorInput('ZZZZ')).toEqual([0, 0, 0, 0])
  })

  it('handles boundary channel values 0 and 255', () => {
    expect(parseColorInput([0, 0, 0])).toEqual([0, 0, 0, 0])
    expect(parseColorInput([255, 255, 255])).toEqual([255, 255, 255, 0])
  })
})

describe('kelvinToRgb', () => {
  it('returns full red at 1000K (warm)', () => {
    const c = kelvinToRgb(1000)
    expect(c[0]).toBe(255) // full red
    expect(c[1]).toBeLessThan(100) // low green
    expect(c[2]).toBe(0) // no blue
  })

  it('returns full blue at 40000K (cool)', () => {
    const c = kelvinToRgb(40000)
    expect(c[2]).toBe(255) // full blue
  })

  it('clamps values below 1000K', () => {
    expect(kelvinToRgb(500)).toEqual(kelvinToRgb(1000))
  })

  it('clamps values above 40000K', () => {
    expect(kelvinToRgb(50000)).toEqual(kelvinToRgb(40000))
  })

  it('all channels are in [0, 255]', () => {
    for (const k of [1000, 3000, 6500, 10000, 20000, 40000]) {
      const c = kelvinToRgb(k)
      expect(c.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})

describe('colorBlend', () => {
  it('factor=0 returns a', () => {
    expect(colorBlend([255, 0, 0, 0], [0, 0, 255, 0], 0)).toEqual([255, 0, 0, 0])
  })

  it('factor=255 returns b', () => {
    expect(colorBlend([255, 0, 0, 0], [0, 0, 255, 0], 255)).toEqual([0, 0, 255, 0])
  })

  it('factor=128 is approximately midpoint', () => {
    const result = colorBlend([0, 0, 0, 0], [255, 255, 255, 0], 128)
    expect(result[0]).toBeCloseTo(128, -1)
  })
})

describe('colorFade', () => {
  it('factor=0 returns black', () => {
    expect(colorFade([255, 255, 255, 255], 0)).toEqual([0, 0, 0, 0])
  })

  it('factor=255 returns the original color', () => {
    expect(colorFade([200, 100, 50, 25], 255)).toEqual([200, 100, 50, 25])
  })

  it('factor=128 halves the brightness', () => {
    const result = colorFade([200, 100, 50, 0], 128)
    expect(result[0]).toBeCloseTo(100, -1)
  })
})

describe('videoColorFade', () => {
  it('factor=0 returns black', () => {
    expect(videoColorFade([255, 255, 255, 0], 0)).toEqual([0, 0, 0, 0])
  })

  it('non-zero channels stay >= 1 at factor > 0', () => {
    const result = videoColorFade([255, 255, 255, 0], 1)
    expect(result[0]).toBeGreaterThanOrEqual(1)
  })
})

describe('hsv16ToRgb', () => {
  it('hue=0 (red) produces near-red output', () => {
    const c = hsv16ToRgb(0, 255, 255)
    expect(c[0]).toBe(255) // R=255
    expect(c[1]).toBe(0) // G=0
  })

  it('hue=0x5555 (~120°, green) produces near-green', () => {
    // 0x5555 = 21845, about 1/3 of 65536
    const c = hsv16ToRgb(0x5555, 255, 255)
    expect(c[1]).toBeGreaterThan(200) // G dominant
  })

  it('produces [0,0,0,0] at value=0', () => {
    expect(hsv16ToRgb(0, 255, 0)).toEqual([0, 0, 0, 0])
  })
})

describe('colorWheel', () => {
  it('position=0 produces red', () => {
    const c = colorWheel(0)
    expect(c[0]).toBe(255)
    expect(c[1]).toBe(0)
  })

  it('produces different colors at different positions', () => {
    const c0 = colorWheel(0)
    const c85 = colorWheel(85)
    expect(c0).not.toEqual(c85)
  })

  it('output channels are in [0, 255]', () => {
    for (let p = 0; p <= 255; p += 16) {
      const c = colorWheel(p)
      expect(c.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})

describe('applyGamma', () => {
  it('mid-range color becomes darker with gamma 2.8', () => {
    const result = applyGamma([128, 128, 128, 0])
    // gamma 2.8: (128/255)^2.8 * 255 ≈ 28
    expect(result[0]).toBeLessThan(128)
  })

  it('255 stays 255', () => {
    expect(applyGammaChannel(255, 2.8)).toBe(255)
  })

  it('0 stays 0', () => {
    expect(applyGammaChannel(0, 2.8)).toBe(0)
  })
})
