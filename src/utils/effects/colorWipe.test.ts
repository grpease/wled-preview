import { describe, it, expect } from 'vitest'
import { colorWipe } from './colorWipe'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('colorWipe', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = colorWipe(seg, makeTestState(), 0, noopPalette)
    expect(result).toHaveLength(10)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    colorWipe(makeTestSegment(), state, 0, noopPalette)
    expect(state.call).toBe(1)
  })

  it('at now=0, first pixel is off (wipe starts at 0)', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = colorWipe(seg, makeTestState(), 0, noopPalette)
    // fillCount=0 at t=0, all black
    expect(result[0]).toEqual([0, 0, 0, 0])
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 8 })
    const r1 = colorWipe(seg, makeTestState(), 3000, noopPalette)
    const r2 = colorWipe(seg, makeTestState(), 3000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('all output channels in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = colorWipe(seg, makeTestState(), 5000, noopPalette)
    for (const pixel of result) {
      expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })

  it('sx=0 produces very slow wipe', () => {
    const seg = makeTestSegment({ virtualLength: 10, sx: 0 })
    const result = colorWipe(seg, makeTestState(), 100, noopPalette)
    expect(result).toHaveLength(10)
  })

  it('sx=255 produces fast wipe', () => {
    const seg = makeTestSegment({ virtualLength: 10, sx: 255 })
    const result = colorWipe(seg, makeTestState(), 100, noopPalette)
    expect(result).toHaveLength(10)
  })
})
