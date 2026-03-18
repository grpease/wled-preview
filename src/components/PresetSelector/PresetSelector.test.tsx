import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PresetSelector } from './PresetSelector'
import type { Preset } from '../../types/wled'

const makePreset = (id: string, n?: string, seg?: object[]): Preset => ({
  id,
  n: n ?? '',
  on: true,
  bri: 255,
  transition: 7,
  mainseg: 0,
  seg: (seg ?? [
    { id: 0, start: 0, stop: 10, on: true, bri: 255, col: [], fx: 0 },
  ]) as Preset['seg'],
})

describe('PresetSelector', () => {
  it('renders a select element', () => {
    render(<PresetSelector presets={[makePreset('1', 'Red')]} selectedId="1" onChange={vi.fn()} />)
    expect(screen.getByRole('combobox')).toBeDefined()
  })

  it('shows preset name when name field is set', () => {
    render(
      <PresetSelector
        presets={[makePreset('1', 'Ocean Breeze')]}
        selectedId="1"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Ocean Breeze')).toBeDefined()
  })

  it('falls back to "Preset {id}" when name is empty', () => {
    render(<PresetSelector presets={[makePreset('3', '')]} selectedId="3" onChange={vi.fn()} />)
    expect(screen.getByText('Preset 3')).toBeDefined()
  })

  it('skips empty presets (no seg array)', () => {
    const emptyPreset = { ...makePreset('0', ''), seg: [] }
    const validPreset = makePreset('1', 'Valid')
    render(
      <PresetSelector presets={[emptyPreset, validPreset]} selectedId="1" onChange={vi.fn()} />,
    )
    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).not.toContain('Preset 0')
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <PresetSelector
        presets={[makePreset('1', 'A')]}
        selectedId={null}
        onChange={vi.fn()}
        disabled
      />,
    )
    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true)
  })
})
