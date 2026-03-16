import { useState, useEffect, useRef } from 'react'
import type { PresetMap, Preset, LedColor } from './types/wled'
import { parsePresets } from './utils/parsePresets'
import { renderLeds } from './utils/renderLeds'
import { EditorPanel } from './components/EditorPanel/EditorPanel'
import { PreviewPanel } from './components/PreviewPanel/PreviewPanel'
import styles from './App.module.css'

const PARSE_DEBOUNCE_MS = 300
const ERROR_DEBOUNCE_MS = 1000

export function App() {
  const [jsonText, setJsonText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [presetMap, setPresetMap] = useState<PresetMap | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [ledColors, setLedColors] = useState<LedColor[]>([])

  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced JSON parsing: update preview quickly, show errors slowly
  useEffect(() => {
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)

    parseTimerRef.current = setTimeout(() => {
      if (!jsonText.trim()) {
        setPresetMap(null)
        setSelectedPresetId(null)
        setLedColors([])
        setParseError(null)
        return
      }
      try {
        const map = parsePresets(jsonText)
        setPresetMap(map)
        setParseError(null)
        // Auto-select first preset when map changes
        const firstId = Object.keys(map)[0] ?? null
        setSelectedPresetId((prev) => {
          const id = prev && map[prev] ? prev : firstId
          if (id && map[id]) {
            setLedColors(renderLeds(map[id]))
          } else {
            setLedColors([])
          }
          return id
        })
      } catch {
        // JSON invalid — keep last valid state, schedule error display
        errorTimerRef.current = setTimeout(() => {
          setParseError('Invalid JSON — check the editor for syntax errors.')
        }, ERROR_DEBOUNCE_MS - PARSE_DEBOUNCE_MS)
      }
    }, PARSE_DEBOUNCE_MS)

    return () => {
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [jsonText])

  function handleSelectPreset(id: string) {
    setSelectedPresetId(id)
    if (presetMap?.[id]) {
      setLedColors(renderLeds(presetMap[id]))
    }
  }

  const presets: Preset[] = presetMap ? Object.values(presetMap) : []

  return (
    <div className={styles.app}>
      <EditorPanel value={jsonText} onChange={setJsonText} error={parseError} />
      <PreviewPanel
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        ledColors={ledColors}
      />
    </div>
  )
}
