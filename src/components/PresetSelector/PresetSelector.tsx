import type { Preset } from '../../types/wled'
import styles from './PresetSelector.module.css'

interface PresetSelectorProps {
  presets: Preset[]
  selectedId: string | null
  onChange: (id: string) => void
  disabled?: boolean
}

function presetLabel(preset: Preset): string {
  // Use name if available; fallback to "Preset {id}"
  return preset.n?.trim() ? preset.n : `Preset ${preset.id}`
}

export function PresetSelector({ presets, selectedId, onChange, disabled }: PresetSelectorProps) {
  // Skip empty presets (e.g., preset "0" which is often an empty stub)
  const validPresets = presets.filter((p) => p.seg && p.seg.length > 0)

  return (
    <div className={styles.wrapper}>
      <label htmlFor="preset-select" className={styles.label}>
        Preset:
      </label>
      <select
        id="preset-select"
        className={styles.select}
        value={selectedId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || validPresets.length === 0}
        aria-label="Preset selector"
      >
        {(selectedId === null || !validPresets.find((p) => p.id === selectedId)) && (
          <option value="" disabled>
            — select a preset —
          </option>
        )}
        {validPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {presetLabel(preset)}
          </option>
        ))}
      </select>
    </div>
  )
}
