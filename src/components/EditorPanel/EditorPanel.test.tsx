import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditorPanel } from './EditorPanel'

describe('EditorPanel', () => {
  it('renders a textarea', () => {
    render(<EditorPanel value="" onChange={vi.fn()} error={null} />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('displays current value in textarea', () => {
    render(<EditorPanel value='{"test":1}' onChange={vi.fn()} error={null} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('{"test":1}')
  })

  it('calls onChange when textarea content changes', () => {
    const onChange = vi.fn()
    render(<EditorPanel value="" onChange={onChange} error={null} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('shows error message when error prop is set', () => {
    render(<EditorPanel value="" onChange={vi.fn()} error="Invalid JSON syntax" />)
    expect(screen.getByRole('alert').textContent).toBe('Invalid JSON syntax')
  })

  it('does not show error element when error is null', () => {
    render(<EditorPanel value="" onChange={vi.fn()} error={null} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders Load File button', () => {
    render(<EditorPanel value="" onChange={vi.fn()} error={null} />)
    expect(screen.getByRole('button', { name: /load file/i })).toBeDefined()
  })

  it('renders a hidden file input accepting .json', () => {
    render(<EditorPanel value="" onChange={vi.fn()} error={null} />)
    const fileInput = screen.getByLabelText(/load wled json file/i) as HTMLInputElement
    expect(fileInput.type).toBe('file')
    expect(fileInput.accept).toBe('.json')
  })

  it('calls onChange with file content via FileReader', () => {
    const onChange = vi.fn()
    render(<EditorPanel value="" onChange={onChange} error={null} />)

    const fileInput = screen.getByLabelText(/load wled json file/i) as HTMLInputElement

    // Mock FileReader
    const mockReadAsText = vi.fn()
    let onloadCallback: ((ev: ProgressEvent<FileReader>) => void) | undefined
    const mockReader = {
      readAsText: mockReadAsText,
      set onload(cb: (ev: ProgressEvent<FileReader>) => void) {
        onloadCallback = cb
      },
    }
    vi.spyOn(globalThis, 'FileReader').mockImplementation(() => mockReader as unknown as FileReader)

    const file = new File(['{"a":1}'], 'presets.json', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(mockReadAsText).toHaveBeenCalledWith(file)

    // Simulate FileReader load event
    onloadCallback!({ target: { result: '{"a":1}' } } as unknown as ProgressEvent<FileReader>)
    expect(onChange).toHaveBeenCalledWith('{"a":1}')

    vi.restoreAllMocks()
  })
})
