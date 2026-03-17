import { useRef, useState, useEffect } from 'react'
import type { ResolvedSegment, SegmentState, AnimationOptions, RgbwColor } from '../types/wled'
import { EFFECT_REGISTRY, FALLBACK_EFFECT } from '../utils/effects'
import { createPaletteSampler } from '../utils/palettes'
import { blendColors } from '../utils/blendModes'
import { applyReverse, applyMirror } from '../utils/segmentGeometry'
import { applyGamma } from '../utils/colorUtils'

const BLACK: RgbwColor = [0, 0, 0, 0]

function rgbwToCssSimple(col: RgbwColor): string {
  const r = Math.min(255, col[0] + col[3])
  const g = Math.min(255, col[1] + col[3])
  const b = Math.min(255, col[2] + col[3])
  return `rgb(${r}, ${g}, ${b})`
}

function scaleBrightness(col: RgbwColor, bri: number): RgbwColor {
  const f = bri / 255
  return [
    Math.round(col[0] * f),
    Math.round(col[1] * f),
    Math.round(col[2] * f),
    Math.round(col[3] * f),
  ]
}

/**
 * Compute a single frame: render all segments, composite into master buffer,
 * apply global brightness and gamma correction.
 * FR-007, FR-011, FR-015–FR-021.
 * Exported for unit testing.
 */
export function computeFrame(
  resolvedSegments: ResolvedSegment[],
  segmentStateMap: Map<string, SegmentState>,
  now: number,
  options: AnimationOptions,
  globalBri: number,
): RgbwColor[] {
  if (resolvedSegments.length === 0) return []

  // Determine total strip length from max stop value
  const totalLeds = resolvedSegments.reduce((max, seg) => Math.max(max, seg.stop), 0)
  if (totalLeds === 0) return []

  const masterBuffer: RgbwColor[] = Array.from({ length: totalLeds }, () => [...BLACK] as RgbwColor)

  for (const segment of resolvedSegments) {
    if (!segment.on || segment.virtualLength === 0) continue

    const key = `${segment.id}-${segment.fx}`
    if (!segmentStateMap.has(key)) {
      segmentStateMap.set(key, { call: 0, step: 0, aux0: 0, aux1: 0, data: null })
    }
    const state = segmentStateMap.get(key)!

    let pixelBuffer: RgbwColor[]

    if (segment.frz) {
      // Frozen — keep last rendered buffer if available, otherwise render once
      const frozenKey = `frozen-${key}`
      if (!segmentStateMap.has(frozenKey as never)) {
        const effectFn = EFFECT_REGISTRY.get(segment.fx) ?? FALLBACK_EFFECT
        const sampler = createPaletteSampler(segment)
        pixelBuffer = effectFn(segment, state, now, sampler)
        segmentStateMap.set(frozenKey as never, {
          call: 0,
          step: 0,
          aux0: 0,
          aux1: 0,
          data: pixelBuffer,
        })
      } else {
        pixelBuffer = (segmentStateMap.get(frozenKey as never)!.data as RgbwColor[]) ?? []
      }
    } else {
      const effectFn = EFFECT_REGISTRY.get(segment.fx) ?? FALLBACK_EFFECT
      const sampler = createPaletteSampler(segment)
      pixelBuffer = effectFn(segment, state, now, sampler)
    }

    // Apply reverse transform (FR-017)
    if (segment.rev) pixelBuffer = applyReverse(pixelBuffer)

    // Apply mirror transform (FR-018)
    if (segment.mi) pixelBuffer = applyMirror(pixelBuffer)

    // Apply segment brightness (FR-019) and composite into master buffer (FR-020)
    const physLen = segment.stop - segment.start
    for (let physIdx = 0; physIdx < physLen; physIdx++) {
      const masterIdx = segment.start + physIdx

      // Map physical index to virtual buffer index (simple 1:1 for now — grouping/spacing handled by virtualLength)
      const virtualIdx = Math.min(physIdx, pixelBuffer.length - 1)
      if (virtualIdx < 0 || virtualIdx >= pixelBuffer.length) continue

      const pixel = scaleBrightness(pixelBuffer[virtualIdx], segment.bri)
      masterBuffer[masterIdx] = blendColors(masterBuffer[masterIdx], pixel, segment.bm)
    }
  }

  // Apply global brightness (FR-021)
  const effectiveBri = options.brightnessOverride ?? globalBri
  for (let i = 0; i < masterBuffer.length; i++) {
    let col = scaleBrightness(masterBuffer[i], effectiveBri)
    if (options.gammaEnabled) {
      col = applyGamma(col, options.gammaCurve)
    }
    masterBuffer[i] = col
  }

  return masterBuffer
}

/**
 * Animation loop hook — drives real-time LED animation at target FPS.
 * Returns an array of CSS color strings (one per LED).
 * FR-007.
 */
export function useAnimationLoop(
  resolvedSegments: ResolvedSegment[],
  options: AnimationOptions,
  globalBri: number = 255,
): string[] {
  const rafRef = useRef<number | undefined>(undefined)
  const lastFrameRef = useRef<number>(0)
  const segmentStateMapRef = useRef<Map<string, SegmentState>>(new Map())
  const [cssColors, setCssColors] = useState<string[]>([])

  // Clear all segment state on preset change (FR-011a)
  useEffect(() => {
    segmentStateMapRef.current.clear()
  }, [resolvedSegments])

  useEffect(() => {
    const frameInterval = 1000 / options.targetFps

    function tick(timestamp: number) {
      rafRef.current = requestAnimationFrame(tick)
      const elapsed = timestamp - lastFrameRef.current
      if (elapsed < frameInterval) return
      // Drift correction
      lastFrameRef.current = timestamp - (elapsed % frameInterval)

      const buffer = computeFrame(
        resolvedSegments,
        segmentStateMapRef.current,
        timestamp,
        options,
        globalBri,
      )
      setCssColors(buffer.map(rgbwToCssSimple))
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [resolvedSegments, options, globalBri])

  return cssColors
}
