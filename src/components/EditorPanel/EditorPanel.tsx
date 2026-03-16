import styles from './EditorPanel.module.css'

interface EditorPanelProps {
  value: string
  onChange: (text: string) => void
  error: string | null
}

export function EditorPanel({ value, onChange, error }: EditorPanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>JSON Preset file:</h2>
      <textarea
        className={styles.editor}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-label="WLED presets JSON editor"
        aria-describedby={error ? 'editor-error' : undefined}
      />
      {error && (
        <p id="editor-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
