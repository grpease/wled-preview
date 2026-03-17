import { describe, it, expect } from 'vitest'
import { colorloop, rainbowCycle } from './rainbow'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('colorloop', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = colorloop(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(10)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    colorloop(makeTestSegment(), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('all LEDs have the same color (uniform hue)', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const result = colorloop(seg, makeTestState(), 1000, noopPalette)
    expect(result.every((c) => JSON.stringify(c) === JSON.stringify(result[0]))).toBe(true)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const r1 = colorloop(seg, makeTestState(), 5000, noopPalette)
    const r2 = colorloop(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('hue shifts over time', () => {
    const seg = makeTestSegment({ virtualLength: 3 })
    const r0 = colorloop(seg, makeTestState(), 0, noopPalette)
    const r500 = colorloop(seg, makeTestState(), 500, noopPalette)
    // Colors should differ as hue rotates
    expect(r0[0]).not.toEqual(r500[0])
  })
})

describe('rainbowCycle', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = rainbowCycle(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(10)
  })

  it('different LEDs have different hues', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = rainbowCycle(seg, makeTestState(), 0, noopPalette)
    // At least some pixels should differ
    const allSame = result.every((c) => JSON.stringify(c) === JSON.stringify(result[0]))
    expect(allSame).toBe(false)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 8 })
    const r1 = rainbowCycle(seg, makeTestState(), 5000, noopPalette)
    const r2 = rainbowCycle(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('all output channels in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = rainbowCycle(seg, makeTestState(), 1000, noopPalette)
    for (const pixel of result) {
      expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})
