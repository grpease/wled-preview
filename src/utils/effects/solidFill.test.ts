import { describe, it, expect } from 'vitest'
import { solidFill } from './solidFill'
import { makeTestSegment, makeTestState, noopPalette } from './testHelpers'

describe('solidFill', () => {
  it('returns array of virtualLength', () => {
    const seg = makeTestSegment({ virtualLength: 10 })
    const result = solidFill(seg, makeTestState(), 1000, noopPalette)
    expect(result).toHaveLength(10)
  })

  it('increments state.call on each frame', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const state = makeTestState()
    solidFill(seg, state, 1000, noopPalette)
    expect(state.call).toBe(1)
    solidFill(seg, state, 1024, noopPalette)
    expect(state.call).toBe(2)
  })

  it('calls paletteSampler for each LED', () => {
    const seg = makeTestSegment({ virtualLength: 3 })
    let callCount = 0
    const countingPalette = () => {
      callCount++
      return [255, 0, 0, 0] as [number, number, number, number]
    }
    solidFill(seg, makeTestState(), 1000, countingPalette)
    expect(callCount).toBe(3)
  })

  it('all output colors are from palette sampler', () => {
    const seg = makeTestSegment({ virtualLength: 5 })
    const result = solidFill(seg, makeTestState(), 1000, noopPalette)
    expect(result.every((c) => c[0] === 255 && c[1] === 0 && c[2] === 0)).toBe(true)
  })
})
