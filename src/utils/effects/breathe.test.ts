import { describe, it, expect } from 'vitest'
import { breathe } from './breathe'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('breathe', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 8 })
    const result = breathe(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(8)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    breathe(makeTestSegment(), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('all LEDs same color (uniform brightness)', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const result = breathe(seg, makeTestState(), 1000, noopPalette)
    expect(result.every((c) => JSON.stringify(c) === JSON.stringify(result[0]))).toBe(true)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const r1 = breathe(seg, makeTestState(), 5000, noopPalette)
    const r2 = breathe(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('output channels are in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    for (let t = 0; t <= 3000; t += 100) {
      const result = breathe(seg, makeTestState(), t, noopPalette)
      expect(result[0].every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})
