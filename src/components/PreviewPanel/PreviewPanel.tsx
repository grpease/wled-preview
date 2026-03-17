import type { Preset, AnimationOptions, Playlist, PresetMap } from '../../types/wled'
import { PresetSelector } from '../PresetSelector/PresetSelector'
import { LedStrip } from '../LedStrip/LedStrip'
import { AnimationControls } from '../AnimationControls/AnimationControls'
import { PlaylistPlayer } from '../PlaylistPlayer/PlaylistPlayer'
import styles from './PreviewPanel.module.css'

interface PreviewPanelProps {
  presets: Preset[]
  selectedPresetId: string | null
  onSelectPreset: (id: string) => void
  cssColors: string[]
  animationOptions: AnimationOptions
  onAnimationOptionsChange: (opts: AnimationOptions) => void
  playlist?: Playlist | null
  presetMap?: PresetMap | null
}

export function PreviewPanel({
  presets,
  selectedPresetId,
  onSelectPreset,
  cssColors,
  animationOptions,
  onAnimationOptionsChange,
  playlist,
  presetMap,
}: PreviewPanelProps) {
  return (
    <div className={styles.panel}>
      <PresetSelector
        presets={presets}
        selectedId={selectedPresetId}
        onChange={onSelectPreset}
        disabled={presets.length === 0}
      />
      {playlist && presetMap && (
        <PlaylistPlayer playlist={playlist} presets={presetMap} onPresetChange={onSelectPreset} />
      )}
      <AnimationControls options={animationOptions} onChange={onAnimationOptionsChange} />
      <div className={styles.stripContainer}>
        <LedStrip cssColors={cssColors} />
      </div>
    </div>
  )
}
