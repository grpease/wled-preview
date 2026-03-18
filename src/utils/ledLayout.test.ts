import { describe, it, expect } from 'vitest'
import { ledIndexToGridCell } from './ledLayout'

describe('ledIndexToGridCell', () => {
  it('first LED is row 0, col 0 in a 5-wide grid', () => {
    expect(ledIndexToGridCell(0, 5)).toEqual({ index: 0, row: 0, col: 0 })
  })

  it('even row goes left-to-right', () => {
    expect(ledIndexToGridCell(3, 5)).toEqual({ index: 3, row: 0, col: 3 })
  })

  it('odd row goes right-to-left (serpentine)', () => {
    // index 5 = row 1, colRaw 0, serpentine → col = 5-1-0 = 4
    expect(ledIndexToGridCell(5, 5)).toEqual({ index: 5, row: 1, col: 4 })
    // index 6 = row 1, colRaw 1, serpentine → col = 5-1-1 = 3
    expect(ledIndexToGridCell(6, 5)).toEqual({ index: 6, row: 1, col: 3 })
  })

  it('returns correct row for multi-row grids', () => {
    expect(ledIndexToGridCell(10, 5)).toEqual({ index: 10, row: 2, col: 0 })
  })
})
