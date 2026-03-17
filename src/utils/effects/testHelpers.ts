import type { ResolvedSegment, SegmentState, PaletteSamplerFn } from '../../types/wled'

export function makeTestSegment(
  overrides: Partial<ResolvedSegment> & { virtualLength?: number } = {},
): ResolvedSegment {
  const virtualLength = overrides.virtualLength ?? 10
  return {
    id: 0,
    start: 0,
    stop: virtualLength,
    virtualLength,
    on: true,
    bri: 255,
    colors: [
      [255, 0, 0, 0],
      [0, 255, 0, 0],
      [0, 0, 255, 0],
    ],
    fx: 0,
    sx: 128,
    ix: 128,
    pal: 0,
    c1: 128,
    c2: 128,
    c3: 16,
    o1: false,
    o2: false,
    o3: false,
    rev: false,
    mi: false,
    frz: false,
    bm: 0,
    ...overrides,
  }
}

export function makeTestState(): SegmentState {
  return { call: 0, step: 0, aux0: 0, aux1: 0, data: null }
}

export const noopPalette: PaletteSamplerFn = () => [255, 0, 0, 0]
