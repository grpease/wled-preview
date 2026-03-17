import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnimationControls } from './AnimationControls'
import type { AnimationOptions } from '../../types/wled'

const defaultOptions: AnimationOptions = {
  gammaEnabled: false,
  gammaCurve: 2.8,
  targetFps: 42,
  brightnessOverride: 255,
}

describe('AnimationControls', () => {
  it('renders gamma checkbox and brightness slider', () => {
    render(<AnimationControls options={defaultOptions} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).toBeDefined()
    expect(screen.getByRole('slider')).toBeDefined()
  })

  it('checkbox reflects gammaEnabled state', () => {
    const { rerender } = render(<AnimationControls options={defaultOptions} onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    rerender(
      <AnimationControls options={{ ...defaultOptions, gammaEnabled: true }} onChange={vi.fn()} />,
    )
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
  })

  it('toggling gamma calls onChange with updated gammaEnabled', () => {
    const onChange = vi.fn()
    render(<AnimationControls options={defaultOptions} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith({ ...defaultOptions, gammaEnabled: true })
  })

  it('changing brightness slider calls onChange with correct value', () => {
    const onChange = vi.fn()
    render(<AnimationControls options={defaultOptions} onChange={onChange} />)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '128' } })
    expect(onChange).toHaveBeenCalledWith({ ...defaultOptions, brightnessOverride: 128 })
  })

  it('slider and checkbox have accessible labels', () => {
    render(<AnimationControls options={defaultOptions} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/brightness/i)).toBeDefined()
    expect(screen.getByLabelText(/gamma correction/i)).toBeDefined()
  })
})
