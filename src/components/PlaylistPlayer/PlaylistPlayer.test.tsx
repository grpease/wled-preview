import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { PlaylistPlayer } from './PlaylistPlayer'
import type { Playlist, PresetMap } from '../../types/wled'

const makePresets = (): PresetMap => ({
  '1': {
    id: '1',
    n: 'Preset One',
    on: true,
    bri: 255,
    transition: 7,
    mainseg: 0,
    seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [], fx: 0 }],
  },
  '2': {
    id: '2',
    n: 'Preset Two',
    on: true,
    bri: 255,
    transition: 7,
    mainseg: 0,
    seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [], fx: 1 }],
  },
  '3': {
    id: '3',
    n: 'Preset Three',
    on: true,
    bri: 255,
    transition: 7,
    mainseg: 0,
    seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [], fx: 2 }],
  },
})

const playlist: Playlist = {
  ps: [1, 2, 3],
  dur: [10, 10, 10], // 10 × 100ms = 1000ms each
  repeat: 0,
}

describe('PlaylistPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onPresetChange with first preset ID on mount', () => {
    const onPresetChange = vi.fn()
    render(
      <PlaylistPlayer
        playlist={playlist}
        presets={makePresets()}
        onPresetChange={onPresetChange}
      />,
    )
    expect(onPresetChange).toHaveBeenCalledWith('1')
  })

  it('advances to next preset after duration fires', () => {
    const onPresetChange = vi.fn()
    render(
      <PlaylistPlayer
        playlist={playlist}
        presets={makePresets()}
        onPresetChange={onPresetChange}
      />,
    )
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onPresetChange).toHaveBeenCalledWith('2')
  })

  it('advances to third preset after two durations', () => {
    const onPresetChange = vi.fn()
    render(
      <PlaylistPlayer
        playlist={playlist}
        presets={makePresets()}
        onPresetChange={onPresetChange}
      />,
    )
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(onPresetChange).toHaveBeenCalledWith('3')
  })

  it('loops back to first preset after last step (repeat=0 infinite)', () => {
    const onPresetChange = vi.fn()
    render(
      <PlaylistPlayer
        playlist={playlist}
        presets={makePresets()}
        onPresetChange={onPresetChange}
      />,
    )
    act(() => {
      vi.advanceTimersByTime(3100)
    })
    // After 3 steps + loop: should call preset 1 again
    const calls = onPresetChange.mock.calls.map((c) => c[0])
    expect(calls).toContain('1')
    expect(calls[calls.length - 1]).toBe('1')
  })

  it('skips missing preset IDs gracefully', () => {
    const onPresetChange = vi.fn()
    const playlistWithMissing: Playlist = { ps: [99, 2], dur: [10, 10], repeat: 0 }
    render(
      <PlaylistPlayer
        playlist={playlistWithMissing}
        presets={makePresets()}
        onPresetChange={onPresetChange}
      />,
    )
    // Preset 99 is not in presets — onPresetChange should NOT be called for it
    expect(onPresetChange).not.toHaveBeenCalledWith('99')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onPresetChange).toHaveBeenCalledWith('2')
  })
})
