import { describe, it, expect } from 'vitest'
import { parsePresets, parseInput } from './parsePresets'

const SIMPLE_PRESET = JSON.stringify({
  '1': {
    n: 'Red Solid',
    on: true,
    bri: 255,
    transition: 7,
    mainseg: 0,
    seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [[255, 0, 0]], fx: 0 }],
  },
  '2': {
    n: 'Blue Blink',
    on: true,
    bri: 200,
    transition: 7,
    mainseg: 0,
    seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [[0, 0, 255]], fx: 1 }],
  },
})

const STATE_JSON = JSON.stringify({
  on: true,
  bri: 200,
  seg: [{ id: 0, start: 0, stop: 20, on: true, bri: 255, col: [[0, 255, 0]], fx: 9 }],
})

const PRESET_WITH_EMPTY = JSON.stringify({
  '0': {},
  '1': {
    n: 'Valid',
    on: true,
    bri: 255,
    transition: 7,
    mainseg: 0,
    seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [[255, 0, 0]], fx: 0 }],
  },
})

describe('parsePresets', () => {
  it('parses a valid preset map', () => {
    const result = parsePresets(SIMPLE_PRESET)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result['1'].n).toBe('Red Solid')
  })

  it('skips entries without seg array', () => {
    const result = parsePresets(PRESET_WITH_EMPTY)
    expect(result['0']).toBeUndefined()
    expect(result['1']).toBeDefined()
  })

  it('throws SyntaxError on invalid JSON', () => {
    expect(() => parsePresets('not json')).toThrow(SyntaxError)
  })
})

describe('parseInput', () => {
  it('returns type=presets for a presets file', () => {
    const result = parseInput(SIMPLE_PRESET)
    expect(result.type).toBe('presets')
    if (result.type === 'presets') {
      expect(Object.keys(result.presets)).toHaveLength(2)
    }
  })

  it('returns type=state for a state JSON', () => {
    const result = parseInput(STATE_JSON)
    expect(result.type).toBe('state')
    if (result.type === 'state') {
      expect(result.state.bri).toBe(200)
      expect(result.state.seg).toHaveLength(1)
    }
  })

  it('skips empty preset "0" in preset file', () => {
    const result = parseInput(PRESET_WITH_EMPTY)
    expect(result.type).toBe('presets')
    if (result.type === 'presets') {
      expect(result.presets['0']).toBeUndefined()
      expect(result.presets['1']).toBeDefined()
    }
  })

  it('throws on malformed JSON', () => {
    expect(() => parseInput('{')).toThrow()
  })

  it('throws on JSON with no segments', () => {
    expect(() => parseInput('{"foo": "bar"}')).toThrow()
  })

  it('returns type=playlist for playlist JSON', () => {
    const playlist = JSON.stringify({ ps: [1, 2, 3], dur: [50, 50, 50], repeat: 0 })
    const result = parseInput(playlist)
    expect(result.type).toBe('playlist')
  })

  it('preset names are preserved', () => {
    const result = parseInput(SIMPLE_PRESET)
    if (result.type === 'presets') {
      expect(result.presets['2'].n).toBe('Blue Blink')
    }
  })

  it('throws when JSON parses to a non-object (e.g. array)', () => {
    expect(() => parseInput('[1, 2, 3]')).toThrow()
  })

  it('throws when JSON parses to a primitive', () => {
    expect(() => parseInput('"just a string"')).toThrow()
  })

  it('playlist with embedded presets extracts them', () => {
    const json = JSON.stringify({
      ps: [1, 2],
      dur: [50, 50],
      repeat: 0,
      '1': {
        n: 'Fire',
        on: true,
        bri: 255,
        transition: 7,
        mainseg: 0,
        seg: [{ id: 0, start: 0, stop: 10, on: true, bri: 255, col: [[255, 0, 0]], fx: 0 }],
      },
    })
    const result = parseInput(json)
    expect(result.type).toBe('playlist')
    if (result.type === 'playlist') {
      expect(result.presets['1']).toBeDefined()
      expect(result.presets['1'].n).toBe('Fire')
    }
  })
})
