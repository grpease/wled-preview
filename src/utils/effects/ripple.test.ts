import { describe, it, expect } from 'vitest'
import { ripple } from './ripple'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('ripple', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 20 })
    const result = ripple(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(20)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    ripple(makeTestSegment({ virtualLength: 20 }), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('initializes state.data on first call', () => {
    const state = makeTestState()
    expect(state.data).toBeNull()
    ripple(makeTestSegment({ virtualLength: 20 }), state, 1000, noopPalette)
    expect(state.data).not.toBeNull()
  })

  it('all output channels in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 20 })
    const result = ripple(seg, makeTestState(), 1000, noopPalette)
    for (const pixel of result) {
      expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})
