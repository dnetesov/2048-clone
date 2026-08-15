import { afterEach, describe, expect, it, vi } from "vitest"
import { BEST_SCORE_STORAGE_KEY, GAME_STATE_STORAGE_KEY, MAX_HISTORY_LENGTH } from "./constants"
import { createInitialState, gameReducer } from "./reducer"
import { saveGameState } from "./storage"
import type { GameState, Tile } from "./types"

function tile(id: string, value: number, row: number, col: number): Tile {
  return { id, value, row, col }
}

function state(overrides: Partial<GameState>): GameState {
  return {
    tiles: [],
    score: 0,
    bestScore: 0,
    hasWon: false,
    hasSeenWinOverlay: false,
    isGameOver: false,
    history: [],
    ...overrides,
  }
}

function mockRandomSequence(values: number[]): void {
  let index = 0
  vi.spyOn(Math, "random").mockImplementation(() => values[index++] ?? values[values.length - 1] ?? 0)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("gameReducer", () => {
  it("starts a new game with a reset state and keeps the best score", () => {
    mockRandomSequence([0, 0, 0, 0])

    const current = state({
      tiles: [tile("old", 1024, 0, 0)],
      score: 1024,
      bestScore: 4096,
      hasWon: true,
      hasSeenWinOverlay: true,
      isGameOver: true,
      history: [
        {
          tiles: [tile("past", 2, 0, 0)],
          score: 2,
          hasWon: false,
          hasSeenWinOverlay: false,
          isGameOver: false,
        },
      ],
    })

    const next = gameReducer(current, { type: "NEW_GAME" })

    expect(next.score).toBe(0)
    expect(next.bestScore).toBe(4096)
    expect(next.hasWon).toBe(false)
    expect(next.hasSeenWinOverlay).toBe(false)
    expect(next.isGameOver).toBe(false)
    expect(next.history).toEqual([])
    expect(next.tiles).toHaveLength(2)
    expect(next.tiles.map(({ value, row, col }) => ({ value, row, col }))).toEqual([
      { value: 2, row: 0, col: 0 },
      { value: 2, row: 0, col: 1 },
    ])
  })

  it("undo restores the previous valid board without lowering the best score", () => {
    mockRandomSequence([0, 0])

    const previousTiles = [tile("a", 2, 0, 1), tile("b", 2, 0, 2)]
    const current = state({ tiles: previousTiles, bestScore: 100 })

    const moved = gameReducer(current, { type: "MOVE", direction: "left" })
    const undone = gameReducer(moved, { type: "UNDO" })

    expect(moved.score).toBe(4)
    expect(moved.bestScore).toBe(100)
    expect(moved.history).toHaveLength(1)
    expect(undone.tiles).toEqual(previousTiles)
    expect(undone.score).toBe(0)
    expect(undone.bestScore).toBe(100)
    expect(undone.history).toEqual([])
  })

  it("shows the win overlay when a move creates a 2048 tile, then hides it when continuing", () => {
    mockRandomSequence([0, 0])

    const current = state({
      tiles: [tile("a", 1024, 0, 0), tile("b", 1024, 0, 1)],
    })

    const won = gameReducer(current, { type: "MOVE", direction: "left" })
    const continued = gameReducer(won, { type: "CONTINUE_AFTER_WIN" })

    expect(won.score).toBe(2048)
    expect(won.hasWon).toBe(true)
    expect(won.hasSeenWinOverlay).toBe(true)
    expect(continued.hasWon).toBe(true)
    expect(continued.hasSeenWinOverlay).toBe(false)
  })

  it("marks the game over when a valid move leaves a full board with no moves", () => {
    mockRandomSequence([0, 0.95])

    const current = state({
      tiles: [
        tile("a", 2, 0, 1),
        tile("b", 8, 0, 2),
        tile("c", 16, 0, 3),
        tile("d", 32, 1, 0),
        tile("e", 64, 1, 1),
        tile("f", 128, 1, 2),
        tile("g", 256, 1, 3),
        tile("h", 512, 2, 0),
        tile("i", 1024, 2, 1),
        tile("j", 2, 2, 2),
        tile("k", 4, 2, 3),
        tile("l", 8, 3, 0),
        tile("m", 16, 3, 1),
        tile("n", 32, 3, 2),
        tile("o", 64, 3, 3),
      ],
    })

    const gameOver = gameReducer(current, { type: "MOVE", direction: "left" })
    const unchanged = gameReducer(gameOver, { type: "MOVE", direction: "right" })

    expect(gameOver.isGameOver).toBe(true)
    expect(gameOver.tiles).toHaveLength(16)
    expect(unchanged).toBe(gameOver)
  })

  it("does not add undo history or spawn a tile for an invalid move", () => {
    const current = state({
      tiles: [tile("a", 2, 0, 0), tile("b", 4, 0, 1)],
    })

    const next = gameReducer(current, { type: "MOVE", direction: "left" })

    expect(next).toBe(current)
  })

  it("creates an initial state with two starting tiles", () => {
    mockRandomSequence([0, 0, 0, 0])

    const initial = createInitialState()

    expect(initial.tiles).toHaveLength(2)
    expect(initial.score).toBe(0)
    expect(initial.history).toEqual([])
    expect(initial.isGameOver).toBe(false)
  })

  it("restores a persisted game state on startup", () => {
    const saved = state({
      tiles: [tile("t20", 128, 1, 2)],
      score: 512,
      bestScore: 1024,
      hasWon: true,
      history: [
        {
          tiles: [tile("t19", 64, 1, 2)],
          score: 256,
          hasWon: false,
          hasSeenWinOverlay: false,
          isGameOver: false,
        },
      ],
    })

    const storage = new Map<string, string>([
      [GAME_STATE_STORAGE_KEY, JSON.stringify({ ...saved, bestScore: undefined })],
    ])
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })

    const restored = createInitialState()

    expect(restored.tiles).toEqual(saved.tiles)
    expect(restored.score).toBe(512)
    expect(restored.bestScore).toBe(512)
    expect(restored.hasWon).toBe(true)
    expect(restored.history).toEqual(saved.history)
    expect(storage.get(BEST_SCORE_STORAGE_KEY)).toBe("512")
  })

  it("ignores invalid persisted game state and starts a fresh game", () => {
    mockRandomSequence([0, 0, 0, 0])

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === GAME_STATE_STORAGE_KEY ? "{bad json" : null),
      setItem: vi.fn(),
    })

    const initial = createInitialState()

    expect(initial.tiles).toHaveLength(2)
    expect(initial.score).toBe(0)
    expect(initial.history).toEqual([])
  })

  it("syncs tile ID counter with history tiles to prevent collisions after undo+reload", () => {
    const saved = state({
      tiles: [tile("t100", 2, 0, 0), tile("t101", 2, 0, 1), tile("t102", 4, 0, 2)],
      score: 8,
      history: [
        {
          tiles: [
            tile("t100", 2, 0, 0),
            tile("t101", 2, 0, 1),
            tile("t102", 4, 0, 2),
            tile("t103", 2, 0, 3),
          ],
          score: 4,
          hasWon: false,
          hasSeenWinOverlay: false,
          isGameOver: false,
        },
      ],
    })

    const storage = new Map<string, string>([
      [GAME_STATE_STORAGE_KEY, JSON.stringify({ ...saved, bestScore: undefined })],
    ])
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })

    const restored = createInitialState()

    // Undo to the history state — this brings back t103 onto the board
    const undone = gameReducer(restored, { type: "UNDO" })
    expect(undone.tiles).toHaveLength(4)
    expect(undone.tiles.find((t) => t.id === "t103")).toBeDefined()

    // Make a move (right) — t100 and t101 merge, then a new tile spawns.
    // The new tile should have a unique ID beyond t103, not colliding.
    mockRandomSequence([0, 0])
    const moved = gameReducer(undone, { type: "MOVE", direction: "right" })

    const tileIds = moved.tiles.map((t) => t.id)
    const uniqueIds = new Set(tileIds)
    expect(uniqueIds.size).toBe(tileIds.length)
    // The newly spawned tile should have an ID beyond t103
    const newTile = moved.tiles.find((t) => !["t100", "t101", "t102", "t103"].includes(t.id))
    expect(newTile).toBeDefined()
    const match = /^t(\d+)$/.exec(newTile!.id)
    expect(match).not.toBeNull()
    expect(Number.parseInt(match![1], 10)).toBeGreaterThan(103)
  })

  it("logs a warning when saving game state fails due to storage quota", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError")
      }),
    })
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    saveGameState(state({ tiles: [tile("t1", 2, 0, 0)] }))

    expect(warnSpy).toHaveBeenCalledWith("Failed to save game state", expect.any(Error))
  })

  it("caps undo history at MAX_HISTORY_LENGTH entries", () => {
    mockRandomSequence([0, 0])

    // Fill the history up to the cap
    const historyEntries = Array.from({ length: MAX_HISTORY_LENGTH }, (_, i) => ({
      tiles: [tile(`t${i}`, 2, 0, 0)],
      score: i,
      hasWon: false,
      hasSeenWinOverlay: false,
      isGameOver: false,
    }))

    const current = state({
      tiles: [tile("current", 2, 0, 0), tile("next", 2, 0, 1)],
      history: historyEntries,
    })

    const moved = gameReducer(current, { type: "MOVE", direction: "left" })

    expect(moved.history).toHaveLength(MAX_HISTORY_LENGTH)
    // The oldest entry (score 0) was dropped
    expect(moved.history[0].score).toBe(1)
    // The newest entry is the snapshot of the state before the move (score 0)
    expect(moved.history[MAX_HISTORY_LENGTH - 1].score).toBe(0)
  })

  it("persists state without transient animation flags", () => {
    const storage = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })

    saveGameState(
      state({
        tiles: [{ ...tile("t1", 2, 0, 0), isNew: true, hasMerged: true }],
        history: [
          {
            tiles: [{ ...tile("t2", 4, 0, 1), isNew: true }],
            score: 4,
            hasWon: false,
            hasSeenWinOverlay: false,
            isGameOver: false,
          },
        ],
      }),
    )

    const saved = JSON.parse(storage.get(GAME_STATE_STORAGE_KEY) ?? "{}")

    expect(saved.tiles).toEqual([{ id: "t1", value: 2, row: 0, col: 0 }])
    expect(saved.history[0].tiles).toEqual([{ id: "t2", value: 4, row: 0, col: 1 }])
  })

  it("cheat showcase displays every styled tile value without showing the win overlay", () => {
    const current = state({ bestScore: 4096, score: 256 })

    const showcase = gameReducer(current, { type: "CHEAT_SHOWCASE" })

    expect(showcase.tiles.map((showcaseTile) => showcaseTile.value)).toEqual([
      2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048,
    ])
    expect(showcase.bestScore).toBe(4096)
    expect(showcase.score).toBe(0)
    expect(showcase.hasWon).toBe(true)
    expect(showcase.hasSeenWinOverlay).toBe(false)
    expect(showcase.history).toEqual([])
  })

  it("cheat ready-to-win leaves two adjacent 1024 tiles for the next move", () => {
    const current = state({ bestScore: 4096, hasWon: true })

    const ready = gameReducer(current, { type: "CHEAT_READY_TO_WIN" })

    expect(ready.tiles).toEqual([
      tile("cheat-win-left", 1024, 0, 0),
      tile("cheat-win-right", 1024, 0, 1),
    ])
    expect(ready.bestScore).toBe(4096)
    expect(ready.hasWon).toBe(false)
    expect(ready.hasSeenWinOverlay).toBe(false)
    expect(ready.history).toEqual([])
  })
})
