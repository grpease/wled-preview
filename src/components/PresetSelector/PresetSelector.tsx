import type { Preset } from '../../types/wled'
import styles from './PresetSelector.module.css'

interface PresetSelectorProps {
  presets: Preset[]
  selectedId: string | null
  onChange: (id: string) => void
  disabled?: boolean
}

export function PresetSelector({ presets, selectedId, onChange, disabled }: PresetSelectorProps) {
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
        disabled={disabled}
        aria-label="Preset selector"
      >
        {selectedId === null && (
          <option value="" disabled>
            — select a preset —
          </option>
        )}
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.n}
          </option>
        ))}
      </select>
    </div>
  )
}
