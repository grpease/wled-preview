import { describe, it, expect } from 'vitest'
import { chase, runningLights, rainbowChase } from './chase'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('chase', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 12 })
    const result = chase(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(12)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    chase(makeTestSegment(), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 9 })
    const r1 = chase(seg, makeTestState(), 5000, noopPalette)
    const r2 = chase(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('has both lit and unlit LEDs (chase pattern)', () => {
    const seg = makeTestSegment({ virtualLength: 12 })
    const result = chase(seg, makeTestState(), 1000, noopPalette)
    const litCount = result.filter((c) => c[0] > 0 || c[1] > 0 || c[2] > 0).length
    const unlitCount = result.filter((c) => c[0] === 0 && c[1] === 0 && c[2] === 0).length
    expect(litCount).toBeGreaterThan(0)
    expect(unlitCount).toBeGreaterThan(0)
  })

  it('all output channels in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 12 })
    const result = chase(seg, makeTestState(), 1000, noopPalette)
    for (const pixel of result) {
      expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })

  it('sx=0 produces near-static output (slow movement)', () => {
    const seg = makeTestSegment({ virtualLength: 9, sx: 0 })
    const r0 = chase(seg, makeTestState(), 0, noopPalette)
    const r10 = chase(seg, makeTestState(), 10, noopPalette)
    // At very low speed, consecutive short timestamps should be the same
    expect(r0).toEqual(r10)
  })
})

describe('runningLights', () => {
  it('returns array of virtualLength', () => {
    const result = runningLights(
      makeTestSegment({ virtualLength: 8 }),
      makeTestState(),
      1000,
      noopPalette,
    )
    expect(result).toHaveLength(8)
  })

  it('all output channels in [0, 255]', () => {
    const result = runningLights(
      makeTestSegment({ virtualLength: 8 }),
      makeTestState(),
      1000,
      noopPalette,
    )
    for (const pixel of result) {
      expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
    }
  })
})

describe('rainbowChase', () => {
  it('returns array of virtualLength', () => {
    const result = rainbowChase(
      makeTestSegment({ virtualLength: 9 }),
      makeTestState(),
      1000,
      noopPalette,
    )
    expect(result).toHaveLength(9)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 9 })
    const r1 = rainbowChase(seg, makeTestState(), 5000, noopPalette)
    const r2 = rainbowChase(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })
})
