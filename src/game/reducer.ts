import {
  createInitialTiles,
  hasReachedWinningTile,
  isBoardStuck,
  move,
  spawnRandomTile,
  syncTileIdCounter,
} from "./logic"
import { loadBestScore, loadGameState, saveBestScore, saveGameState } from "./storage"
import type { GameAction, GameSnapshot, GameState } from "./types"

const SHOWCASE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]

export function createInitialState(): GameState {
  const bestScore = loadBestScore()
  const savedState = loadGameState()

  if (savedState) {
    syncTileIdCounter(savedState.tiles)

    const restoredBestScore = Math.max(bestScore, savedState.score)
    if (restoredBestScore !== bestScore) saveBestScore(restoredBestScore)

    return {
      ...savedState,
      bestScore: restoredBestScore,
    }
  }

  return {
    tiles: createInitialTiles(),
    score: 0,
    bestScore,
    hasWon: false,
    hasSeenWinOverlay: false,
    isGameOver: false,
    history: [],
  }
}

function snapshot(state: GameState): GameSnapshot {
  return {
    tiles: state.tiles,
    score: state.score,
    hasWon: state.hasWon,
    hasSeenWinOverlay: state.hasSeenWinOverlay,
    isGameOver: state.isGameOver,
  }
}

function createShowcaseTiles() {
  return SHOWCASE_VALUES.map((value, index) => ({
    id: `cheat-showcase-${value}`,
    value,
    row: Math.floor(index / 4),
    col: index % 4,
  }))
}

function persist(nextState: GameState): GameState {
  saveGameState(nextState)
  return nextState
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME": {
      return persist({
        tiles: createInitialTiles(),
        score: 0,
        bestScore: state.bestScore,
        hasWon: false,
        hasSeenWinOverlay: false,
        isGameOver: false,
        history: [],
      })
    }

    case "MOVE": {
      if (state.isGameOver) return state

      const { tiles: movedTiles, gainedScore, moved } = move(state.tiles, action.direction)

      if (!moved) return state

      const historyEntry = snapshot(state)

      const newTile = spawnRandomTile(movedTiles)
      const tilesWithSpawn = newTile ? [...movedTiles, newTile] : movedTiles

      const newScore = state.score + gainedScore
      const newBestScore = Math.max(state.bestScore, newScore)
      if (newBestScore !== state.bestScore) saveBestScore(newBestScore)

      const justWon = !state.hasWon && hasReachedWinningTile(tilesWithSpawn)

      return persist({
        tiles: tilesWithSpawn,
        score: newScore,
        bestScore: newBestScore,
        hasWon: state.hasWon || justWon,
        hasSeenWinOverlay: state.hasSeenWinOverlay || justWon,
        isGameOver: isBoardStuck(tilesWithSpawn),
        history: [...state.history, historyEntry],
      })
    }

    case "UNDO": {
      if (state.history.length === 0) return state

      const previous = state.history[state.history.length - 1]

      return persist({
        ...previous,
        bestScore: state.bestScore,
        history: state.history.slice(0, -1),
      })
    }

    case "CONTINUE_AFTER_WIN": {
      return persist({ ...state, hasSeenWinOverlay: false })
    }

    case "CHEAT_SHOWCASE": {
      return persist({
        tiles: createShowcaseTiles(),
        score: 0,
        bestScore: state.bestScore,
        hasWon: true,
        hasSeenWinOverlay: false,
        isGameOver: false,
        history: [],
      })
    }

    case "CHEAT_READY_TO_WIN": {
      return persist({
        tiles: [
          { id: "cheat-win-left", value: 1024, row: 0, col: 0 },
          { id: "cheat-win-right", value: 1024, row: 0, col: 1 },
        ],
        score: 0,
        bestScore: state.bestScore,
        hasWon: false,
        hasSeenWinOverlay: false,
        isGameOver: false,
        history: [],
      })
    }

    default:
      return state
  }
}
