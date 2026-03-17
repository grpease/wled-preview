import { describe, it, expect } from 'vitest'
import {
  virtualLength,
  physicalToVirtual,
  applyReverse,
  applyMirror,
  resolveSegment,
} from './segmentGeometry'
import type { Segment } from '../types/wled'

describe('virtualLength', () => {
  it('simple segment: physLen=10, grp=1, spc=0, mi=false → 10', () => {
    expect(virtualLength(1, 0, 10, false)).toBe(10)
  })

  it('grouping: physLen=10, grp=2, spc=0, mi=false → 5', () => {
    expect(virtualLength(2, 0, 10, false)).toBe(5)
  })

  it('spacing: physLen=10, grp=1, spc=1, mi=false → 5', () => {
    expect(virtualLength(1, 1, 10, false)).toBe(5)
  })

  it('mirror halves virtual length: physLen=10, grp=1, spc=0, mi=true → 5', () => {
    expect(virtualLength(1, 0, 10, true)).toBe(5)
  })

  it('mirror with odd: physLen=11, grp=1, spc=0, mi=true → ceil(11/2)=6', () => {
    expect(virtualLength(1, 0, 11, true)).toBe(6)
  })

  it('zero physLen returns 0', () => {
    expect(virtualLength(1, 0, 0, false)).toBe(0)
  })

  it('negative physLen returns 0', () => {
    expect(virtualLength(1, 0, -5, false)).toBe(0)
  })

  it('grouping+spacing: physLen=12, grp=2, spc=1 → ceil(12/3)=4', () => {
    expect(virtualLength(2, 1, 12, false)).toBe(4)
  })
})

describe('physicalToVirtual', () => {
  it('grp=1 spc=0: returns offset directly', () => {
    expect(physicalToVirtual(3, 0, 1, 0)).toBe(3)
  })

  it('grp=2 spc=0: groups of 2 map to same virtual index', () => {
    expect(physicalToVirtual(0, 0, 2, 0)).toBe(0)
    expect(physicalToVirtual(1, 0, 2, 0)).toBe(0)
    expect(physicalToVirtual(2, 0, 2, 0)).toBe(1)
  })

  it('returns null for spacing gaps', () => {
    // grp=1, spc=1: every other LED is a gap
    expect(physicalToVirtual(0, 0, 1, 1)).toBe(0)
    expect(physicalToVirtual(1, 0, 1, 1)).toBeNull()
    expect(physicalToVirtual(2, 0, 1, 1)).toBe(1)
    expect(physicalToVirtual(3, 0, 1, 1)).toBeNull()
  })

  it('respects segment start offset', () => {
    expect(physicalToVirtual(5, 5, 1, 0)).toBe(0)
    expect(physicalToVirtual(6, 5, 1, 0)).toBe(1)
  })
})

describe('applyReverse', () => {
  it('reverses array', () => {
    expect(applyReverse([1, 2, 3, 4])).toEqual([4, 3, 2, 1])
  })

  it('does not mutate original', () => {
    const original = [1, 2, 3]
    applyReverse(original)
    expect(original).toEqual([1, 2, 3])
  })

  it('single element unchanged', () => {
    expect(applyReverse([42])).toEqual([42])
  })
})

describe('applyMirror', () => {
  it('mirrors 3-element buffer to 6 elements', () => {
    const result = applyMirror([1, 2, 3])
    expect(result).toHaveLength(6)
    expect(result[0]).toBe(1)
    expect(result[1]).toBe(2)
    expect(result[2]).toBe(3)
    expect(result[3]).toBe(3)
    expect(result[4]).toBe(2)
    expect(result[5]).toBe(1)
  })

  it('mirrors 2-element buffer symmetrically', () => {
    const result = applyMirror([10, 20])
    expect(result).toEqual([10, 20, 20, 10])
  })
})

describe('resolveSegment', () => {
  const baseSeg: Segment = {
    id: 0,
    start: 0,
    stop: 10,
    on: true,
    bri: 255,
    col: [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ],
    fx: 0,
  }

  it('sets virtualLength from stop-start for default grp/spc', () => {
    const resolved = resolveSegment(baseSeg)
    expect(resolved.virtualLength).toBe(10)
  })

  it('resolves RGB color arrays to RgbwColor', () => {
    const resolved = resolveSegment(baseSeg)
    expect(resolved.colors[0]).toEqual([255, 0, 0, 0])
    expect(resolved.colors[1]).toEqual([0, 255, 0, 0])
    expect(resolved.colors[2]).toEqual([0, 0, 255, 0])
  })

  it('fills missing col slots with black', () => {
    const seg: Segment = { ...baseSeg, col: [] }
    const resolved = resolveSegment(seg)
    expect(resolved.colors[0]).toEqual([0, 0, 0, 0])
    expect(resolved.colors[1]).toEqual([0, 0, 0, 0])
    expect(resolved.colors[2]).toEqual([0, 0, 0, 0])
  })

  it('applies defaults for missing optional fields', () => {
    const resolved = resolveSegment(baseSeg)
    expect(resolved.rev).toBe(false)
    expect(resolved.mi).toBe(false)
    expect(resolved.frz).toBe(false)
    expect(resolved.bm).toBe(0)
    expect(resolved.pal).toBe(0)
  })

  it('applies grouping to virtualLength', () => {
    const seg: Segment = { ...baseSeg, grp: 2, spc: 0 }
    const resolved = resolveSegment(seg)
    expect(resolved.virtualLength).toBe(5)
  })

  it('resolves hex color string', () => {
    const seg: Segment = { ...baseSeg, col: ['FF0000'] }
    const resolved = resolveSegment(seg)
    expect(resolved.colors[0]).toEqual([255, 0, 0, 0])
  })
})
