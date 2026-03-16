import type { LedColor } from '../../types/wled'
import { ledIndexToGridCell } from '../../utils/ledLayout'
import { LedCircle } from '../LedCircle/LedCircle'
import styles from './LedStrip.module.css'

// Known WLED effect names for common IDs
const EFFECT_NAMES: Record<number, string> = {
  0: 'Solid',
  1: 'Blink',
  2: 'Breathe',
  8: 'Rainbow',
  65: 'Colorloop',
  81: 'Aurora',
  114: 'Fireworks',
}

function effectName(id: number): string {
  return EFFECT_NAMES[id] ?? `Effect #${id}`
}

interface LedStripProps {
  ledColors: LedColor[]
  totalLeds: number
  rowWidth: number
}

export function LedStrip({ ledColors, totalLeds, rowWidth }: LedStripProps) {
  if (totalLeds === 0) {
    return (
      <div className={styles.empty}>
        Paste a WLED presets JSON to see the LED strip preview.
      </div>
    )
  }

  const totalRows = Math.ceil(totalLeds / rowWidth)

  // Build grid: rows × cols, place each LED at its serpentine position
  const grid: (LedColor | null)[][] = Array.from({ length: totalRows }, () =>
    Array(rowWidth).fill(null),
  )

  for (let i = 0; i < totalLeds; i++) {
    const cell = ledIndexToGridCell(i, rowWidth)
    const ledColor = ledColors[i] ?? { index: i, cssColor: 'rgb(0,0,0)', isOff: true }
    grid[cell.row][cell.col] = ledColor
  }

  // Detect first LED index of each non-solid effect segment for badge placement
  const effectBadges = new Map<number, number>() // ledIndex → effectId
  for (const led of ledColors) {
    if (led.effectId !== undefined && led.effectId !== 0) {
      const cellIdx = led.index
      // Only mark the first LED of each effect run
      if (!effectBadges.has(cellIdx - 1)) {
        effectBadges.set(cellIdx, led.effectId)
      }
    }
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.labelStart}>Start</span>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${rowWidth}, 20px)` }}
      >
        {grid.flatMap((row, rowIdx) =>
          row.map((led, colIdx) => {
            if (led === null) return null
            const effectId = effectBadges.get(led.index)
            return (
              <div key={led.index} className={styles.cell} style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }}>
                <LedCircle
                  cssColor={led.cssColor}
                  isOff={led.isOff}
                  index={led.index}
                  effectId={effectId}
                />
                {effectId !== undefined && (
                  <span className={styles.effectBadge} title={effectName(effectId)}>
                    {effectName(effectId)}
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>
      <span className={styles.labelEnd}>End</span>
    </div>
  )
}
