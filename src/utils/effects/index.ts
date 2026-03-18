import type { EffectFn } from '../../types/wled'
import { solidFill } from './solidFill'
import { blink } from './blink'
import { breathe } from './breathe'
import { colorWipe } from './colorWipe'
import { colorloop, rainbowCycle } from './rainbow'
import { chase, runningLights, rainbowChase } from './chase'
import { twinkle } from './twinkle'
import { meteor } from './meteor'
import { fire2012 } from './fire2012'
import { ripple } from './ripple'

// Registry of effect ID → effect function (FR-010)
export const EFFECT_REGISTRY = new Map<number, EffectFn>([
  [0, solidFill],
  [1, blink],
  [2, breathe],
  [3, colorWipe],
  [6, colorWipe], // Color Sweep (same algorithm)
  [8, colorloop],
  [9, rainbowCycle],
  [13, chase],
  [15, runningLights],
  [17, twinkle],
  [20, twinkle], // Sparkle (same algorithm)
  [28, rainbowChase],
  [29, rainbowChase],
  [30, rainbowChase],
  [31, rainbowChase],
  [32, rainbowChase],
  [33, rainbowChase],
  [41, meteor], // Comet
  [66, fire2012],
  [76, meteor], // Meteor
  [79, ripple],
  [99, ripple], // Ripple Rainbow
  [105, breathe], // Heartbeat (same sine-wave algorithm)
])

// Fallback for unregistered effect IDs — static gray placeholder (FR-010)
export const FALLBACK_EFFECT: EffectFn = (segment) =>
  Array.from(
    { length: segment.virtualLength },
    () => [64, 64, 64, 0] as [number, number, number, number],
  )
