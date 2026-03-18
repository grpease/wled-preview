import styles from './LedStrip.module.css'

const MIN_CELL_PX = 5

interface LedStripProps {
  cssColors: string[]
}

export function LedStrip({ cssColors }: LedStripProps) {
  if (cssColors.length === 0) {
    return (
      <div className={styles.empty}>Paste a WLED presets JSON to see the LED strip preview.</div>
    )
  }

  const totalLeds = cssColors.length
  const stripWidth = totalLeds * (MIN_CELL_PX + 1) // cell + 1px gap

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.strip} style={{ width: `${stripWidth}px` }}>
        {cssColors.map((color, i) => (
          <div
            key={i}
            className={styles.led}
            style={{ backgroundColor: color }}
            aria-label={`LED ${i}`}
            title={`LED ${i}: ${color}`}
          />
        ))}
      </div>
    </div>
  )
}
