import { BEST_SCORE_STORAGE_KEY, GAME_STATE_STORAGE_KEY, GRID_SIZE } from "./constants"
import type { GameSnapshot, GameState, Tile } from "./types"

type StoredGameState = Omit<GameState, "bestScore">

export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_STORAGE_KEY)
    if (raw === null) return 0
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  } catch {
    return 0
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score))
  } catch {
    // Ignore
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isValidTile(value: unknown): value is Tile {
  if (!isRecord(value)) return false

  const tileValue = value.value
  const row = value.row
  const col = value.col

  return (
    typeof value.id === "string" &&
    typeof tileValue === "number" &&
    Number.isInteger(tileValue) &&
    tileValue > 0 &&
    typeof row === "number" &&
    Number.isInteger(row) &&
    row >= 0 &&
    row < GRID_SIZE &&
    typeof col === "number" &&
    Number.isInteger(col) &&
    col >= 0 &&
    col < GRID_SIZE
  )
}

function hasUniqueCells(tiles: Tile[]): boolean {
  return new Set(tiles.map((tile) => `${tile.row},${tile.col}`)).size === tiles.length
}

function sanitizeTiles(tiles: Tile[]): Tile[] {
  return tiles.map(({ id, value, row, col }) => ({ id, value, row, col }))
}

function parseSnapshot(value: unknown): GameSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.tiles)) return null

  const tiles = value.tiles
  if (!tiles.every(isValidTile) || !hasUniqueCells(tiles)) return null

  if (
    typeof value.score !== "number" ||
    !Number.isFinite(value.score) ||
    value.score < 0 ||
    typeof value.hasWon !== "boolean" ||
    typeof value.hasSeenWinOverlay !== "boolean" ||
    typeof value.isGameOver !== "boolean"
  ) {
    return null
  }

  return {
    tiles: sanitizeTiles(tiles),
    score: value.score,
    hasWon: value.hasWon,
    hasSeenWinOverlay: value.hasSeenWinOverlay,
    isGameOver: value.isGameOver,
  }
}

export function loadGameState(): StoredGameState | null {
  try {
    const raw = localStorage.getItem(GAME_STATE_STORAGE_KEY)
    if (raw === null) return null

    const parsed: unknown = JSON.parse(raw)
    const snapshot = parseSnapshot(parsed)
    if (!snapshot || !isRecord(parsed) || !Array.isArray(parsed.history)) return null

    const history = parsed.history.map(parseSnapshot)
    if (history.some((entry) => entry === null)) return null

    return {
      ...snapshot,
      history: history as GameSnapshot[],
    }
  } catch {
    return null
  }
}

export function saveGameState(state: GameState): void {
  try {
    const storedState: StoredGameState = {
      tiles: sanitizeTiles(state.tiles),
      score: state.score,
      hasWon: state.hasWon,
      hasSeenWinOverlay: state.hasSeenWinOverlay,
      isGameOver: state.isGameOver,
      history: state.history.map((entry) => ({
        ...entry,
        tiles: sanitizeTiles(entry.tiles),
      })),
    }

    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(storedState))
  } catch {
    // Ignore
  }
}
