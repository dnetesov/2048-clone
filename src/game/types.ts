export type Direction = "up" | "down" | "left" | "right"

export type Tile = {
  id: string
  value: number
  row: number
  col: number
  // for the spawn animation
  isNew?: boolean
  // for the pop animation
  hasMerged?: boolean
}

export type GameSnapshot = {
  tiles: Tile[]
  score: number
  hasWon: boolean
  hasSeenWinOverlay: boolean
  isGameOver: boolean
}

export type GameState = {
  tiles: Tile[]
  score: number
  bestScore: number
  hasWon: boolean
  hasSeenWinOverlay: boolean
  isGameOver: boolean
  history: GameSnapshot[]
}

export type GameAction =
  | { type: "NEW_GAME" }
  | { type: "MOVE"; direction: Direction }
  | { type: "UNDO" }
  | { type: "CONTINUE_AFTER_WIN" }
  | { type: "CHEAT_SHOWCASE" }
  | { type: "CHEAT_READY_TO_WIN" }
