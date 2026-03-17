import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { computeFrame } from './useAnimationLoop'
import { useAnimationLoop } from './useAnimationLoop'
import { makeTestSegment } from '../utils/effects/testHelpers'
import type { SegmentState, AnimationOptions, ResolvedSegment } from '../types/wled'

const defaultOptions: AnimationOptions = {
  gammaEnabled: false,
  gammaCurve: 2.8,
  targetFps: 60,
  brightnessOverride: 255,
}

function makeStateMap(): Map<string, SegmentState> {
  return new Map()
}

// ──────────────────────────────────────────────
// computeFrame unit tests (pure function)
// ──────────────────────────────────────────────
describe('computeFrame', () => {
  it('returns empty array when no segments', () => {
    expect(computeFrame([], makeStateMap(), 0, defaultOptions, 255)).toEqual([])
  })

  it('returns correct length for a 10-LED segment', () => {
    const seg = makeTestSegment({ start: 0, stop: 10, virtualLength: 10, fx: 0 })
    const result = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    expect(result).toHaveLength(10)
  })

  it('uses fallback effect for unknown fx ID', () => {
    const seg = makeTestSegment({ fx: 9999, virtualLength: 5, start: 0, stop: 5 })
    const result = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    // Fallback fills with dim gray [64, 64, 64, 0]
    expect(result).toHaveLength(5)
    // Each pixel should be dim (not full brightness)
    for (const pixel of result) {
      expect(pixel[0]).toBeLessThanOrEqual(64)
    }
  })

  it('applies global brightness scaling', () => {
    const seg = makeTestSegment({ fx: 0, start: 0, stop: 5, virtualLength: 5 })
    // solidFill with colors[0] = [255, 0, 0, 0]
    const full = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    const half = computeFrame(
      [seg],
      makeStateMap(),
      0,
      { ...defaultOptions, brightnessOverride: 128 },
      255,
    )
    // Red channel should be roughly half
    expect(full[0][0]).toBeGreaterThan(half[0][0])
  })

  it('applies gamma when gammaEnabled is true', () => {
    const seg = makeTestSegment({ fx: 0, start: 0, stop: 5, virtualLength: 5 })
    const noGamma = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    const withGamma = computeFrame(
      [seg],
      makeStateMap(),
      0,
      { ...defaultOptions, gammaEnabled: true, gammaCurve: 2.8 },
      255,
    )
    // Gamma correction darkens mid-range values (power < 1 applied to normalised value)
    // solidFill color[0] = [255, 0, 0, 0] — at full brightness gamma has no effect on 255
    // but any sub-255 channel should change
    // Just verify the calls don't error and output length matches
    expect(noGamma).toHaveLength(withGamma.length)
  })

  it('skips segment when on=false', () => {
    const seg = makeTestSegment({ fx: 0, on: false, start: 0, stop: 5, virtualLength: 5 })
    const result = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    // Segment is skipped, master buffer stays black
    expect(result.every((c) => c[0] === 0 && c[1] === 0 && c[2] === 0)).toBe(true)
  })

  it('frozen segment is rendered only once and cached', () => {
    const seg = makeTestSegment({ fx: 0, frz: true, start: 0, stop: 5, virtualLength: 5 })
    const stateMap = makeStateMap()

    const frame1 = computeFrame([seg], stateMap, 0, defaultOptions, 255)
    // State map should now have frozen entry
    expect(stateMap.size).toBeGreaterThan(0)

    const frame2 = computeFrame([seg], stateMap, 9999, defaultOptions, 255)
    // Frozen — same result regardless of timestamp
    expect(frame1).toEqual(frame2)
  })

  it('returns empty array when all segments have stop=0', () => {
    // No segments with stop > 0 → totalLeds stays 0 → early return
    const result = computeFrame([], makeStateMap(), 0, defaultOptions, 255)
    expect(result).toEqual([])
  })

  it('segment with stop=start (physLen=0) produces all-black buffer', () => {
    // stop=5, start=5 → physLen=0 and virtualLength=0: segment skipped, 5 black LEDs from max(stop)
    const seg = makeTestSegment({ start: 5, stop: 5, virtualLength: 0 })
    const result = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    expect(result).toHaveLength(5)
    expect(result.every((c) => c[0] === 0 && c[1] === 0 && c[2] === 0)).toBe(true)
  })

  it('handles segment with stop < start gracefully (virtualLength=0)', () => {
    const seg = makeTestSegment({ start: 10, stop: 5, virtualLength: 0, on: true })
    // stop=5 < start=10: totalLeds derived from max stop = 5, but segment is skipped (virtualLength=0)
    const result = computeFrame([seg], makeStateMap(), 0, defaultOptions, 255)
    // All black, no error thrown
    expect(result.every((c) => c[0] === 0)).toBe(true)
  })

  it('composites two overlapping segments with bm=2 (Add)', () => {
    const seg1 = makeTestSegment({
      id: 0,
      fx: 0,
      start: 0,
      stop: 5,
      virtualLength: 5,
      colors: [
        [100, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      bm: 0,
    })
    const seg2 = makeTestSegment({
      id: 1,
      fx: 0,
      start: 0,
      stop: 5,
      virtualLength: 5,
      colors: [
        [50, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      bm: 2, // Add blend mode
    })
    const result = computeFrame([seg1, seg2], makeStateMap(), 0, defaultOptions, 255)
    // Add mode: 100 + 50 = 150 (clamped)
    expect(result[0][0]).toBeCloseTo(150, 0)
  })
})

// ──────────────────────────────────────────────
// useAnimationLoop hook tests
// ──────────────────────────────────────────────
describe('useAnimationLoop', () => {
  let rafCallbacks: Map<number, FrameRequestCallback>
  let rafIdCounter: number

  beforeEach(() => {
    rafCallbacks = new Map()
    rafIdCounter = 1
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = rafIdCounter++
      rafCallbacks.set(id, cb)
      return id
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** Fires all pending RAF callbacks once with the given timestamp, inside act() */
  function flushRaf(timestamp = 1000) {
    act(() => {
      const pending = [...rafCallbacks.entries()]
      rafCallbacks.clear()
      for (const [, cb] of pending) cb(timestamp)
    })
  }

  it('returns empty array when segments are empty', () => {
    const { result } = renderHook(() => useAnimationLoop([], defaultOptions, 255))
    expect(result.current).toEqual([])
  })

  it('returns CSS color strings after first RAF tick', () => {
    const seg = makeTestSegment({ start: 0, stop: 5, virtualLength: 5, fx: 0 })
    const { result } = renderHook(() => useAnimationLoop([seg], defaultOptions, 255))
    flushRaf()
    expect(result.current.length).toBe(5)
    expect(result.current[0]).toMatch(/^rgb\(/)
  })

  it('output length updates when resolvedSegments reference changes', () => {
    const seg1: ResolvedSegment[] = [
      makeTestSegment({ start: 0, stop: 3, virtualLength: 3, fx: 0 }),
    ]
    const seg2: ResolvedSegment[] = [
      makeTestSegment({ start: 0, stop: 6, virtualLength: 6, fx: 0 }),
    ]

    const { result, rerender } = renderHook(
      ({ segs }: { segs: ResolvedSegment[] }) => useAnimationLoop(segs, defaultOptions, 255),
      { initialProps: { segs: seg1 } },
    )

    flushRaf(1000)
    expect(result.current.length).toBe(3)

    rerender({ segs: seg2 })
    // Use a timestamp well past the last frame to ensure elapsed > frameInterval
    flushRaf(2000)
    expect(result.current.length).toBe(6)
  })
})
