import type { PresetMap, Preset } from '../types/wled'

/**
 * Parse a raw WLED presets JSON string into a typed PresetMap.
 * Throws SyntaxError if the text is not valid JSON.
 * Returns an empty object if the JSON is valid but contains no preset keys.
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
