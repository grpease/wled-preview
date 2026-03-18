import type { Segment, ResolvedSegment, ColorInput, RgbwColor } from '../types/wled'
import { parseColorInput } from './colorUtils'

// Default values for missing segment fields (per WLED firmware defaults)
const DEFAULTS = {
  grp: 1,
  spc: 0,
  of: 0,
  rev: false,
  mi: false,
  frz: false,
  sx: 128,
  ix: 128,
  pal: 0,
  c1: 128,
  c2: 128,
  c3: 16,
  o1: false,
  o2: false,
  o3: false,
  bm: 0,
} as const

/**
 * Compute virtual segment length from physical length, grouping, spacing, and mirror flag.
 * Formula per WLED spec Section 4.3:
 *   vLen = ceil(physLen / (grp + spc))
 *   if mirror: vLen = ceil(vLen / 2)
 */
export function virtualLength(grp: number, spc: number, physLen: number, mi: boolean): number {
  if (physLen <= 0) return 0
  const groupLen = grp + spc
  let vLen = Math.ceil(physLen / groupLen)
  if (mi) vLen = Math.ceil(vLen / 2)
  return Math.max(vLen, 0)
}

/**
 * Map physical LED index to virtual LED index within a segment.
 * Returns null if the physical index falls in a spacing gap.
 */
export function physicalToVirtual(
  physIndex: number,
  segStart: number,
  grp: number,
  spc: number,
): number | null {
  const offset = physIndex - segStart
  const groupLen = grp + spc
  const groupPos = offset % groupLen
  if (groupPos >= grp) return null // in spacing gap
  return Math.floor(offset / groupLen)
}

/**
 * Apply reverse transform to a pixel buffer: flip rendering direction.
 */
export function applyReverse<T>(buffer: T[]): T[] {
  return [...buffer].reverse()
}

/**
 * Apply mirror transform: first half of segment is reflected to second half.
 * The effect runs on virtualLength pixels (half of physical), then is mirrored.
 */
export function applyMirror<T>(buffer: T[]): T[] {
  const len = buffer.length
  const result = new Array<T>(len * 2)
  for (let i = 0; i < len; i++) {
    result[i] = buffer[i]
    result[len * 2 - 1 - i] = buffer[i]
  }
  return result
}

const BLACK: RgbwColor = [0, 0, 0, 0]

function resolveColorSlot(input: ColorInput | undefined): RgbwColor {
  if (!input) return BLACK
  return parseColorInput(input)
}

/**
 * Resolve a raw Segment to a ResolvedSegment — applies defaults, parses colors,
 * and computes virtualLength. Random colors ("r") are resolved once here.
 */
export function resolveSegment(seg: Segment): ResolvedSegment {
  const grp = seg.grp ?? DEFAULTS.grp
  const spc = seg.spc ?? DEFAULTS.spc
  const mi = seg.mi ?? DEFAULTS.mi
  const physLen = seg.stop - seg.start

  const vLen = virtualLength(grp, spc, physLen, mi)

  const col0 = resolveColorSlot(seg.col?.[0])
  const col1 = resolveColorSlot(seg.col?.[1])
  const col2 = resolveColorSlot(seg.col?.[2])

  return {
    id: seg.id,
    start: seg.start,
    stop: seg.stop,
    virtualLength: vLen,
    on: seg.on,
    bri: seg.bri,
    colors: [col0, col1, col2],
    fx: seg.fx,
    sx: seg.sx ?? DEFAULTS.sx,
    ix: seg.ix ?? DEFAULTS.ix,
    pal: seg.pal ?? DEFAULTS.pal,
    c1: seg.c1 ?? DEFAULTS.c1,
    c2: seg.c2 ?? DEFAULTS.c2,
    c3: seg.c3 ?? DEFAULTS.c3,
    o1: seg.o1 ?? DEFAULTS.o1,
    o2: seg.o2 ?? DEFAULTS.o2,
    o3: seg.o3 ?? DEFAULTS.o3,
    rev: seg.rev ?? DEFAULTS.rev,
    mi,
    frz: seg.frz ?? DEFAULTS.frz,
    bm: seg.bm ?? DEFAULTS.bm,
  }
}
