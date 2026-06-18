import {
  createInitialTiles,
  hasReachedWinningTile,
  isBoardStuck,
  move,
  spawnRandomTile,
} from "./logic"
import { loadBestScore, saveBestScore } from "./storage"
import type { GameAction, GameSnapshot, GameState } from "./types"

export function createInitialState(): GameState {
  return {
    tiles: createInitialTiles(),
    score: 0,
    bestScore: loadBestScore(),
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

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME": {
      return {
        tiles: createInitialTiles(),
        score: 0,
        bestScore: state.bestScore,
        hasWon: false,
        hasSeenWinOverlay: false,
        isGameOver: false,
        history: [],
      }
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

      return {
        tiles: tilesWithSpawn,
        score: newScore,
        bestScore: newBestScore,
        hasWon: state.hasWon || justWon,
        hasSeenWinOverlay: state.hasSeenWinOverlay || justWon,
        isGameOver: isBoardStuck(tilesWithSpawn),
        history: [...state.history, historyEntry],
      }
    }

    case "UNDO": {
      if (state.history.length === 0) return state

      const previous = state.history[state.history.length - 1]

      return {
        ...previous,
        bestScore: state.bestScore,
        history: state.history.slice(0, -1),
      }
    }

    case "CONTINUE_AFTER_WIN": {
      return { ...state, hasSeenWinOverlay: false }
    }

    default:
      return state
  }
}
