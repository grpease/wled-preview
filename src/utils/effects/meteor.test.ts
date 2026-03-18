import { describe, it, expect } from 'vitest'
import { meteor } from './meteor'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('meteor', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 20 })
    const result = meteor(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(20)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    meteor(makeTestSegment(), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const r1 = meteor(seg, makeTestState(), 5000, noopPalette)
    const r2 = meteor(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('all output channels in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 20 })
    const result = meteor(seg, makeTestState(), 1000, noopPalette)
    for (const pixel of result) {
      expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })

  it('has at least one lit LED (head is always bright)', () => {
    const seg = makeTestSegment({ virtualLength: 20 })
    const result = meteor(seg, makeTestState(), 1000, noopPalette)
    const hasLit = result.some((c) => c[0] > 0 || c[1] > 0 || c[2] > 0)
    expect(hasLit).toBe(true)
  })
})
