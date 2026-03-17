import { useRef } from 'react'
import styles from './EditorPanel.module.css'

interface EditorPanelProps {
  value: string
  onChange: (text: string) => void
  error: string | null
}

export function EditorPanel({ value, onChange, error }: EditorPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') onChange(text)
    }
    reader.readAsText(file)
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.heading}>JSON Preset file:</h2>
        <button
          className={styles.loadButton}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Load File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className={styles.fileInput}
          onChange={handleFileChange}
          aria-label="Load WLED JSON file"
        />
      </div>
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
