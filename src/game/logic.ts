import { GRID_SIZE, SPAWN_TWO_PROBABILITY, WINNING_VALUE } from "./constants"
import type { Direction, Tile } from "./types"

/** Monotonic counter guaranteeing unique tile ids within a session. */
let tileIdCounter = 0

function createTileId(): string {
  tileIdCounter += 1
  return `t${tileIdCounter}`
}

/** Returns every grid coordinate that is not currently occupied by a tile. */
function getEmptyCells(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = new Set(tiles.map((tile) => `${tile.row},${tile.col}`))
  const empty: Array<{ row: number; col: number }> = []

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!occupied.has(`${row},${col}`)) {
        empty.push({ row, col })
      }
    }
  }

  return empty
}

/**
 * Returns a new tile placed on a random empty cell, or null if the board is
 * full. New tiles are 2 with 90% probability and 4 with 10% probability.
 */
export function spawnRandomTile(tiles: Tile[]): Tile | null {
  const emptyCells = getEmptyCells(tiles)
  if (emptyCells.length === 0) return null

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const value = Math.random() < SPAWN_TWO_PROBABILITY ? 2 : 4

  return { id: createTileId(), value, row, col, isNew: true }
}

/** Creates a fresh board with two starting tiles. */
export function createInitialTiles(): Tile[] {
  const tiles: Tile[] = []
  const first = spawnRandomTile(tiles)
  if (first) tiles.push(first)
  const second = spawnRandomTile(tiles)
  if (second) tiles.push(second)
  return tiles
}

/**
 * The board is processed line by line. For a given direction we read each row
 * or column in the order tiles travel, so compression/merging is always a
 * simple left-to-right pass over the extracted line.
 */
function getTraversalLines(direction: Direction): Array<Array<{ row: number; col: number }>> {
  const lines: Array<Array<{ row: number; col: number }>> = []

  for (let primary = 0; primary < GRID_SIZE; primary++) {
    const line: Array<{ row: number; col: number }> = []
    for (let secondary = 0; secondary < GRID_SIZE; secondary++) {
      switch (direction) {
        case "left":
          line.push({ row: primary, col: secondary })
          break
        case "right":
          line.push({ row: primary, col: GRID_SIZE - 1 - secondary })
          break
        case "up":
          line.push({ row: secondary, col: primary })
          break
        case "down":
          line.push({ row: GRID_SIZE - 1 - secondary, col: primary })
          break
      }
    }
    lines.push(line)
  }

  return lines
}

export type MoveResult = {
  tiles: Tile[]
  /** Sum of the values produced by merges during this move. */
  gainedScore: number
  /** True when at least one tile changed position or merged. */
  moved: boolean
}

/**
 * Applies a move in the given direction. Pure: it never mutates its input and
 * never spawns a new tile (the reducer handles spawning only on valid moves).
 *
 * Each output tile keeps a stable id where possible so the UI can animate it
 * sliding to its new position. Merges produce a single new tile flagged with
 * `hasMerged`, and a tile may only merge once per move.
 */
export function move(tiles: Tile[], direction: Direction): MoveResult {
  const lines = getTraversalLines(direction)
  const resultTiles: Tile[] = []
  let gainedScore = 0
  let moved = false

  for (const line of lines) {
    // Tiles present in this line, ordered the way they travel.
    const lineTiles = line
      .map(({ row, col }) => tiles.find((t) => t.row === row && t.col === col))
      .filter((t): t is Tile => t !== undefined)

    let targetIndex = 0

    for (let i = 0; i < lineTiles.length; i++) {
      const current = lineTiles[i]
      const next = lineTiles[i + 1]

      if (next && current.value === next.value) {
        // Merge current and next into a single tile at the target slot.
        const { row, col } = line[targetIndex]
        const mergedValue = current.value * 2
        resultTiles.push({
          id: current.id,
          value: mergedValue,
          row,
          col,
          hasMerged: true,
        })
        gainedScore += mergedValue
        moved = true
        i++ // Skip `next`; it has been consumed by this merge.
      } else {
        const { row, col } = line[targetIndex]
        if (current.row !== row || current.col !== col) moved = true
        resultTiles.push({ id: current.id, value: current.value, row, col })
      }

      targetIndex++
    }
  }

  return { tiles: resultTiles, gainedScore, moved }
}

/** True once any tile has reached the winning value. */
export function hasReachedWinningTile(tiles: Tile[]): boolean {
  return tiles.some((tile) => tile.value >= WINNING_VALUE)
}

/**
 * The game is over when the board is full and no move in any direction would
 * change the board (i.e. no adjacent equal tiles exist).
 */
export function isBoardStuck(tiles: Tile[]): boolean {
  if (getEmptyCells(tiles).length > 0) return false

  const directions: Direction[] = ["up", "down", "left", "right"]
  return directions.every((direction) => !move(tiles, direction).moved)
}
