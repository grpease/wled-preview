import type { PresetMap, Preset, WLEDStateJSON, Playlist, ParseResult } from '../types/wled'

/**
 * Parse a raw WLED presets JSON string into a typed PresetMap.
 * Throws SyntaxError if the text is not valid JSON.
 * Returns an empty object if the JSON has no preset keys with segments.
 */
export function parsePresets(jsonText: string): PresetMap {
  const raw = JSON.parse(jsonText) as Record<string, unknown>
  const result: PresetMap = {}

  for (const [key, value] of Object.entries(raw)) {
    if (value && typeof value === 'object' && 'seg' in value) {
      result[key] = { id: key, ...(value as Omit<Preset, 'id'>) }
    }
  }

  return result
}

/**
 * Detect whether a parsed JSON object is a Playlist definition.
 */
function isPlaylist(obj: unknown): obj is Playlist {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'ps' in obj &&
    Array.isArray((obj as Record<string, unknown>).ps) &&
    'dur' in obj &&
    Array.isArray((obj as Record<string, unknown>).dur)
  )
}

/**
 * Detect whether a parsed JSON object is a WLED state (has a `seg` array).
 */
function isWLEDState(obj: unknown): obj is WLEDStateJSON {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'seg' in obj &&
    Array.isArray((obj as Record<string, unknown>).seg)
  )
}

/**
 * Parse any WLED JSON input and return a discriminated ParseResult.
 * Handles three formats: presets file, state JSON, and playlist.
 * FR-022, FR-023, FR-024.
 */
export function parseInput(jsonText: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid JSON: could not parse the file.')
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid WLED JSON: expected an object.')
  }

  const obj = raw as Record<string, unknown>

  // Check for playlist at root (has `ps` and `dur` arrays)
  if (isPlaylist(obj)) {
    // Playlist may embed presets in the same file
    const presets: PresetMap = {}
    for (const [key, value] of Object.entries(obj)) {
      const numKey = Number(key)
      if (!isNaN(numKey) && value && typeof value === 'object' && 'seg' in value) {
        presets[key] = { id: key, ...(value as Omit<Preset, 'id'>) }
      }
    }
    return { type: 'playlist', playlist: obj as unknown as Playlist, presets }
  }

  // Check for direct WLED state (has `seg` at root)
  if (isWLEDState(obj)) {
    return {
      type: 'state',
      state: {
        on: typeof obj.on === 'boolean' ? obj.on : true,
        bri: typeof obj.bri === 'number' ? obj.bri : 255,
        transition: typeof obj.transition === 'number' ? obj.transition : undefined,
        ps: typeof obj.ps === 'number' ? obj.ps : undefined,
        pl: typeof obj.pl === 'number' ? obj.pl : undefined,
        seg: obj.seg as WLEDStateJSON['seg'],
      },
    }
  }

  // Otherwise treat as presets file (numeric keys with seg arrays)
  const presets: PresetMap = {}
  let hasAny = false
  for (const [key, value] of Object.entries(obj)) {
    if (!value || typeof value !== 'object') continue
    const v = value as Record<string, unknown>
    // Skip empty presets (preset "0" is often an empty stub)
    if (!('seg' in v)) continue
    hasAny = true
    presets[key] = { id: key, ...(v as Omit<Preset, 'id'>) }
  }

  if (!hasAny) {
    throw new Error(
      'Invalid WLED JSON: no segments found. Expected a presets file, state JSON, or playlist.',
    )
  }

  return { type: 'presets', presets }
}
