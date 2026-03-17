import { useEffect, useRef, useState } from 'react'
import type { Playlist, PresetMap } from '../../types/wled'
import styles from './PlaylistPlayer.module.css'

interface PlaylistPlayerProps {
  playlist: Playlist
  presets: PresetMap
  onPresetChange: (id: string) => void
}

export function PlaylistPlayer({ playlist, presets, onPresetChange }: PlaylistPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (playlist.ps.length === 0) return

    function advance(currentStep: number) {
      const presetId = String(playlist.ps[currentStep])
      // Skip missing preset IDs
      if (presets[presetId]) {
        onPresetChange(presetId)
      }

      const durationMs = (playlist.dur[currentStep] ?? 50) * 100
      const nextStep = currentStep + 1

      if (nextStep >= playlist.ps.length) {
        const repeatCount = playlist.repeat ?? 0
        if (repeatCount === 0) {
          // Infinite loop
          timerRef.current = setTimeout(() => {
            setStepIndex(0)
            advance(0)
          }, durationMs)
        }
        // repeat > 0 would need a counter — for now stop after one cycle
      } else {
        timerRef.current = setTimeout(() => {
          setStepIndex(nextStep)
          advance(nextStep)
        }, durationMs)
      }
    }

    setStepIndex(0)
    advance(0)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [playlist, presets]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentPresetId = String(playlist.ps[stepIndex])
  const currentPreset = presets[currentPresetId]
  const presetName = currentPreset?.n?.trim() || `Preset ${currentPresetId}`
  const totalSteps = playlist.ps.length

  return (
    <div className={styles.player}>
      <span className={styles.label}>Playlist:</span>
      <span className={styles.step}>
        {presetName} ({stepIndex + 1}/{totalSteps})
      </span>
    </div>
  )
}
