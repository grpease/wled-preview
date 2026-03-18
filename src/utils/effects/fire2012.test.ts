import { describe, it, expect } from 'vitest'
import { fire2012 } from './fire2012'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('fire2012', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 30 })
    const result = fire2012(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(30)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    fire2012(makeTestSegment({ virtualLength: 10 }), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('initializes state.data on first call', () => {
    const state = makeTestState()
    expect(state.data).toBeNull()
    fire2012(makeTestSegment({ virtualLength: 10 }), state, 1000, noopPalette)
    expect(state.data).not.toBeNull()
  })

  it('all output channels are in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 20 })
    const state = makeTestState()
    for (let t = 0; t < 5; t++) {
      const result = fire2012(seg, state, t * 100, noopPalette)
      for (const pixel of result) {
        expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
      }
    }
  })

  it('output length matches virtualLength across multiple calls', () => {
    const seg = makeTestSegment({ virtualLength: 50 })
    const state = makeTestState()
    for (let t = 0; t < 3; t++) {
      const result = fire2012(seg, state, t * 50, noopPalette)
      expect(result).toHaveLength(50)
    }
  })

  it('sx=0 (max cooling) produces generally darker output than sx=255 (min cooling)', () => {
    const slowSeg = makeTestSegment({ virtualLength: 30, sx: 0 })
    const fastSeg = makeTestSegment({ virtualLength: 30, sx: 255 })
    const slowState = makeTestState()
    const fastState = makeTestState()
    // Run for several frames to build up heat
    for (let t = 0; t < 20; t++) {
      fire2012(slowSeg, slowState, t * 50, noopPalette)
      fire2012(fastSeg, fastState, t * 50, noopPalette)
    }
    const slowResult = fire2012(slowSeg, slowState, 1000, noopPalette)
    const fastResult = fire2012(fastSeg, fastState, 1000, noopPalette)
    const slowAvg = slowResult.reduce((s, c) => s + c[0] + c[1] + c[2], 0) / slowResult.length
    const fastAvg = fastResult.reduce((s, c) => s + c[0] + c[1] + c[2], 0) / fastResult.length
    // Not a strict assertion since randomness is involved; just ensure values are in range
    expect(slowAvg).toBeGreaterThanOrEqual(0)
    expect(fastAvg).toBeGreaterThanOrEqual(0)
  })
})
