import { useRef } from "react"
import type { Direction, GameState } from "../game/types"
import { useSwipeControls } from "../hooks/useSwipeControls"
import { GridBackground } from "./GridCell"
import { Tile, TileShadow } from "./Tile"
import { GameOverlay } from "./GameOverlay"

type BoardProps = {
  state: GameState
  onMove: (direction: Direction) => void
  onNewGame: () => void
  onContinue: () => void
  onUndo: () => void
}

/**
 * Renders the static grid, the absolutely positioned tile layer, and any
 * active overlay. Tiles are keyed by id so React reuses DOM nodes across moves,
 * which lets CSS transitions animate them sliding to new positions.
 */
export function Board({ state, onMove, onNewGame, onContinue, onUndo }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  useSwipeControls(boardRef, onMove)

  const showWinOverlay = state.hasSeenWinOverlay
  const showGameOverOverlay = state.isGameOver

  return (
    <div className="board" ref={boardRef}>
      <GridBackground />

      <div className="tile-shadow-layer">
        {state.tiles.map((tile) => (
          <TileShadow key={`${tile.id}-shadow`} tile={tile} />
        ))}
      </div>

      <div className="tile-layer">
        {state.tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>

      {showWinOverlay && (
        <GameOverlay variant="win" onContinue={onContinue} onNewGame={onNewGame} />
      )}

      {showGameOverOverlay && (
        <GameOverlay
          variant="gameover"
          onNewGame={onNewGame}
          onUndo={onUndo}
          canUndo={state.history.length > 0}
        />
      )}
    </div>
  )
}
