import type { LedColor, Preset } from '../../types/wled'
import { PresetSelector } from '../PresetSelector/PresetSelector'
import { LedStrip } from '../LedStrip/LedStrip'
import styles from './PreviewPanel.module.css'

const ROW_WIDTH = 25

interface PreviewPanelProps {
  presets: Preset[]
  selectedPresetId: string | null
  onSelectPreset: (id: string) => void
  ledColors: LedColor[]
  rowWidth?: number
}

export function PreviewPanel({
  presets,
  selectedPresetId,
  onSelectPreset,
  ledColors,
  rowWidth = ROW_WIDTH,
}: PreviewPanelProps) {
  const totalLeds = ledColors.length

  return (
    <div className={styles.panel}>
      <PresetSelector
        presets={presets}
        selectedId={selectedPresetId}
        onChange={onSelectPreset}
        disabled={presets.length === 0}
      />
      <div className={styles.stripContainer}>
        <LedStrip ledColors={ledColors} totalLeds={totalLeds} rowWidth={rowWidth} />
      </div>
    </div>
  )
}
