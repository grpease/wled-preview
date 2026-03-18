import type { AnimationOptions } from '../../types/wled'
import styles from './AnimationControls.module.css'

interface AnimationControlsProps {
  options: AnimationOptions
  onChange: (opts: AnimationOptions) => void
}

export function AnimationControls({ options, onChange }: AnimationControlsProps) {
  function setGamma(enabled: boolean) {
    onChange({ ...options, gammaEnabled: enabled })
  }

  function setBrightness(bri: number) {
    onChange({ ...options, brightnessOverride: bri })
  }

  return (
    <div className={styles.controls}>
      <label className={styles.gammaLabel}>
        <input
          type="checkbox"
          checked={options.gammaEnabled}
          onChange={(e) => setGamma(e.target.checked)}
          aria-label="Enable gamma correction"
        />
        Gamma correction (γ {options.gammaCurve.toFixed(1)})
      </label>
      <div className={styles.brightnessRow}>
        <label htmlFor="brightness-slider" className={styles.briLabel}>
          Brightness:
        </label>
        <input
          id="brightness-slider"
          type="range"
          min={0}
          max={255}
          value={options.brightnessOverride ?? 255}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className={styles.slider}
          aria-label="Global brightness"
        />
        <span className={styles.briValue}>
          {Math.round(((options.brightnessOverride ?? 255) / 255) * 100)}%
        </span>
      </div>
    </div>
  )
}
