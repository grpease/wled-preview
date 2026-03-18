import { describe, it, expect } from 'vitest'
import { twinkle } from './twinkle'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('twinkle', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 15 })
    const result = twinkle(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(15)
  })

  it('increments state.call', () => {
    const state = makeTestState()
    twinkle(makeTestSegment(), state, 1000, noopPalette)
    expect(state.call).toBe(1)
  })

  it('initializes state.data on first call', () => {
    const state = makeTestState()
    expect(state.data).toBeNull()
    twinkle(makeTestSegment(), state, 1000, noopPalette)
    expect(state.data).not.toBeNull()
  })

  it('all output channels in [0, 255]', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const state = makeTestState()
    for (let t = 0; t < 5; t++) {
      const result = twinkle(seg, state, t * 100, noopPalette)
      for (const pixel of result) {
        expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
      }
    }
  })

  it('state persists across frames', () => {
    const state = makeTestState()
    const seg = makeTestSegment({ virtualLength: 10 })
    twinkle(seg, state, 1000, noopPalette)
    twinkle(seg, state, 1100, noopPalette)
    // data may change (brightness updates), but should not reset to null
    expect(state.data).not.toBeNull()
    expect(state.call).toBe(2)
  })

  it('exercises brightness clamping and direction reversal over many frames', () => {
    // High speed (sx=255) and intensity (ix=255) causes brightness to cycle quickly
    const seg = makeTestSegment({
      virtualLength: 5,
      sx: 255,
      ix: 255,
      colors: [
        [255, 128, 64, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    })
    const state = makeTestState()
    // Run 200 frames to guarantee brightness hits both 255 and 0 for some LEDs
    for (let i = 0; i < 200; i++) {
      const result = twinkle(seg, state, i * 16, noopPalette)
      // All pixels must remain in valid range regardless of internal state
      for (const pixel of result) {
        expect(pixel.every((v) => v >= 0 && v <= 255)).toBe(true)
      }
    }
    expect(state.call).toBe(200)
  })
})
