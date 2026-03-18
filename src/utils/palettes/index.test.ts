import { describe, it, expect } from 'vitest'
import { sampleGradientPalette, sampleFastLEDPalette, createPaletteSampler } from './index'
import { GRADIENT_PALETTES } from './gradientData'
import { FASTLED_PALETTES } from './fastledPalettes'
import { makeTestSegment } from '../effects/testHelpers'

describe('sampleGradientPalette', () => {
  const FIRE = GRADIENT_PALETTES[35]

  it('position=0 returns the first stop color', () => {
    const result = sampleGradientPalette(FIRE, 0)
    expect(result).toEqual([0, 0, 0, 0]) // Fire starts at black
  })

  it('position=255 returns the last stop color', () => {
    const result = sampleGradientPalette(FIRE, 255)
    expect(result).toEqual([255, 255, 255, 0]) // Fire ends at white
  })

  it('position=128 returns a mid-range color', () => {
    const result = sampleGradientPalette(FIRE, 128)
    // Mid-fire should be somewhere between dark red and yellow
    expect(result[0]).toBeGreaterThan(0)
    expect(result.every((v) => v >= 0 && v <= 255)).toBe(true)
  })

  it('all channels in [0, 255] for all positions', () => {
    for (let p = 0; p <= 255; p += 16) {
      const result = sampleGradientPalette(FIRE, p)
      expect(result.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })

  it('clamps positions outside 0–255', () => {
    expect(sampleGradientPalette(FIRE, -10)).toEqual(sampleGradientPalette(FIRE, 0))
    expect(sampleGradientPalette(FIRE, 300)).toEqual(sampleGradientPalette(FIRE, 255))
  })

  it('handles degenerate palette with two stops at the same position', () => {
    // When a[0] === b[0], return a's color directly
    const degenPalette: [number, number, number, number][] = [
      [128, 200, 100, 50],
      [128, 200, 100, 50], // same position
    ]
    const result = sampleGradientPalette(degenPalette, 128)
    expect(result).toEqual([200, 100, 50, 0])
  })

  it('samples all 59 gradient palettes without error', () => {
    for (const id of Object.keys(GRADIENT_PALETTES).map(Number)) {
      const palette = GRADIENT_PALETTES[id]
      expect(() => sampleGradientPalette(palette, 0)).not.toThrow()
      expect(() => sampleGradientPalette(palette, 128)).not.toThrow()
      expect(() => sampleGradientPalette(palette, 255)).not.toThrow()
    }
  })
})

describe('sampleFastLEDPalette', () => {
  const RAINBOW = FASTLED_PALETTES[10]

  it('position=0 returns first entry', () => {
    const result = sampleFastLEDPalette(RAINBOW, 0)
    expect(result[0]).toBe(255) // Rainbow first entry: red
    expect(result[1]).toBe(0)
  })

  it('all channels in [0, 255]', () => {
    for (let p = 0; p <= 255; p += 16) {
      const result = sampleFastLEDPalette(RAINBOW, p)
      expect(result.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})

describe('createPaletteSampler', () => {
  it('pal=0 (Default): returns primary color faded by brightness', () => {
    const seg = makeTestSegment({ pal: 0, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    const result = sampler(128, 255, 0) // full brightness
    expect(result).toEqual(seg.colors[0])
  })

  it('pal=0: uses specified color slot', () => {
    const seg = makeTestSegment({ pal: 0, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    expect(sampler(0, 255, 1)).toEqual(seg.colors[1])
    expect(sampler(0, 255, 2)).toEqual(seg.colors[2])
  })

  it('pal=35 (Fire): returns a color from Fire gradient at position 0', () => {
    const seg = makeTestSegment({ pal: 35, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    const result = sampler(0, 255, 0)
    expect(result).toEqual([0, 0, 0, 0]) // Fire at pos 0 = black
  })

  it('pal=10 (Rainbow): returns different colors at different positions', () => {
    const seg = makeTestSegment({ pal: 10, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    const c0 = sampler(0, 255)
    const c128 = sampler(128, 255)
    expect(c0).not.toEqual(c128)
  })

  it('brightness=0 returns black', () => {
    const seg = makeTestSegment({ pal: 0, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    expect(sampler(128, 0, 0)).toEqual([0, 0, 0, 0])
  })

  it('pal=999 (out of range): falls back to primary color', () => {
    const seg = makeTestSegment({ pal: 999, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    const result = sampler(128, 255, 0)
    // Out of range → colors[0] faded at full brightness = colors[0]
    expect(result).toEqual(seg.colors[0])
  })

  it('pal=1 (Random Cycle): returns Fire gradient color', () => {
    const seg = makeTestSegment({ pal: 1, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    const atZero = sampler(0, 255)
    expect(atZero).toEqual([0, 0, 0, 0]) // Fire at pos 0 = black
  })

  it('pal=3 (special 2-5): returns primary color', () => {
    const seg = makeTestSegment({ pal: 3, virtualLength: 5 })
    const sampler = createPaletteSampler(seg)
    const result = sampler(128, 255, 0)
    expect(result).toEqual(seg.colors[0])
  })
})
