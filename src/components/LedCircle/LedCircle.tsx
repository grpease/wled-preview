import styles from './LedCircle.module.css'

interface LedCircleProps {
  cssColor: string
  isOff: boolean
  index: number
  effectId?: number
}

export function LedCircle({ cssColor, isOff, index, effectId }: LedCircleProps) {
  const color = isOff ? '#2a2a2a' : cssColor
  const title = isOff
    ? `LED ${index} (off)`
    : `LED ${index} — ${cssColor}${effectId !== undefined ? ` [fx:${effectId}]` : ''}`

  return (
    <div
      className={styles.circle}
      style={{ backgroundColor: color }}
      aria-label={`LED ${index}`}
      title={title}
      role="img"
    />
  )
}
