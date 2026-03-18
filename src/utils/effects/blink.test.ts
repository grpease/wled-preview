import { describe, it, expect } from 'vitest'
import { blink } from './blink'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('blink', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = blink(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(10)
  })

  it('increments state.call', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const state = makeTestState()
    blink(seg, state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('all LEDs have the same color (solid per phase)', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const result = blink(seg, makeTestState(), 1000, noopPalette)
    expect(result.every((c) => JSON.stringify(c) === JSON.stringify(result[0]))).toBe(true)
  })

  it('produces deterministic output for fixed now', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const r1 = blink(seg, makeTestState(), 5000, noopPalette)
    const r2 = blink(seg, makeTestState(), 5000, noopPalette)
    expect(r1).toEqual(r2)
  })

  it('sx=0 produces a slow blink (long period)', () => {
    // At sx=0, period ≈ 10000ms; at t=0 and t=4999 should be same phase
    const seg = makeTestSegment({ virtualLength: 3, sx: 0 })
    const r0 = blink(seg, makeTestState(), 0, noopPalette)
    const r4999 = blink(seg, makeTestState(), 4999, noopPalette)
    expect(r0).toEqual(r4999)
  })

  it('sx=255 produces a fast blink (short period)', () => {
    // At sx=255, periodMs=100: phase changes at multiples of 100ms
    // t=0 is phase 0 (primary), t=101 is phase 1 (secondary)
    const seg = makeTestSegment({ virtualLength: 3, sx: 255 })
    const r0 = blink(seg, makeTestState(), 0, noopPalette)
    const r101 = blink(seg, makeTestState(), 101, noopPalette)
    expect(r0).not.toEqual(r101)
  })
})
