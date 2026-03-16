import type { LedGridCell } from '../types/wled'

/**
 * Map a LED index to its 2D position in a serpentine grid.
 * Even rows (0, 2, …) go left-to-right; odd rows (1, 3, …) go right-to-left.
 *
 * @param index    - 0-based LED index
 * @param rowWidth - number of LEDs per row
 */
export function ledIndexToGridCell(index: number, rowWidth: number): LedGridCell {
  const row = Math.floor(index / rowWidth)
  const colRaw = index % rowWidth
  const col = row % 2 === 0 ? colRaw : rowWidth - 1 - colRaw
  return { index, row, col }
}
