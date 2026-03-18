import { useState, useEffect, useRef, useMemo } from 'react'
import type { PresetMap, Preset, ResolvedSegment, AnimationOptions, Playlist } from './types/wled'
import { parseInput } from './utils/parsePresets'
import { resolveSegment } from './utils/segmentGeometry'
import { useAnimationLoop } from './hooks/useAnimationLoop'
import { EditorPanel } from './components/EditorPanel/EditorPanel'
import { PreviewPanel } from './components/PreviewPanel/PreviewPanel'
import styles from './App.module.css'

const PARSE_DEBOUNCE_MS = 300
const ERROR_DEBOUNCE_MS = 1000

const DEFAULT_ANIMATION_OPTIONS: AnimationOptions = {
  gammaEnabled: false,
  gammaCurve: 2.8,
  targetFps: 42,
  brightnessOverride: 255,
}

export function App() {
  const [jsonText, setJsonText] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [presetMap, setPresetMap] = useState<PresetMap | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [animationOptions, setAnimationOptions] =
    useState<AnimationOptions>(DEFAULT_ANIMATION_OPTIONS)
  const [globalBri, setGlobalBri] = useState(255)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)

  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced JSON parsing
  useEffect(() => {
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)

    parseTimerRef.current = setTimeout(() => {
      if (!jsonText.trim()) {
        setPresetMap(null)
        setSelectedPresetId(null)
        setParseError(null)
        return
      }
      try {
        const result = parseInput(jsonText)
        if (result.type === 'presets') {
          setPresetMap(result.presets)
          const firstId = Object.keys(result.presets)[0] ?? null
          setSelectedPresetId(firstId)
          setGlobalBri(
            firstId && result.presets[firstId] ? (result.presets[firstId].bri ?? 255) : 255,
          )
        } else if (result.type === 'state') {
          // Wrap single state as preset "1"
          const fakePreset: Preset = {
            id: '1',
            n: 'State',
            on: result.state.on,
            bri: result.state.bri,
            transition: result.state.transition ?? 7,
            mainseg: 0,
            seg: result.state.seg,
          }
          const map: PresetMap = { '1': fakePreset }
          setPresetMap(map)
          setSelectedPresetId('1')
          setGlobalBri(result.state.bri)
        } else if (result.type === 'playlist') {
          setPresetMap(result.presets)
          setPlaylist(result.playlist)
          const firstId = String(result.playlist.ps[0] ?? '')
          setSelectedPresetId(firstId || null)
        }
        setParseError(null)
      } catch (err) {
        errorTimerRef.current = setTimeout(() => {
          setParseError(
            err instanceof Error
              ? err.message
              : 'Invalid JSON — check the editor for syntax errors.',
          )
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
      setGlobalBri(presetMap[id].bri ?? 255)
    }
  }

  // Resolve selected preset segments
  const resolvedSegments = useMemo<ResolvedSegment[]>(() => {
    if (!presetMap || !selectedPresetId || !presetMap[selectedPresetId]) return []
    const preset = presetMap[selectedPresetId]
    if (!preset.on) return [] // Global off → all LEDs black
    return preset.seg
      .filter((seg) => seg.stop > seg.start) // skip inactive stubs
      .map((seg) => resolveSegment(seg))
  }, [presetMap, selectedPresetId])

  const cssColors = useAnimationLoop(resolvedSegments, animationOptions, globalBri)

  const presets: Preset[] = presetMap ? Object.values(presetMap) : []

  return (
    <div className={styles.app}>
      <EditorPanel value={jsonText} onChange={setJsonText} error={parseError} />
      <PreviewPanel
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        cssColors={cssColors}
        animationOptions={animationOptions}
        onAnimationOptionsChange={setAnimationOptions}
        playlist={playlist}
        presetMap={presetMap}
      />
    </div>
  )
}
