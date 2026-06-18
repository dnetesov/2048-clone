import { Button } from "./Button"

type GameOverlayProps = {
  variant: "win" | "gameover"
  onNewGame: () => void
  onContinue?: () => void
  onUndo?: () => void
  canUndo?: boolean
}

// For Win and Game Over states, modal style overlay
export function GameOverlay({
  variant,
  onNewGame,
  onContinue,
  onUndo,
  canUndo,
}: GameOverlayProps) {
  const isWin = variant === "win"

  return (
    <div className={`overlay overlay--${variant}`} role="dialog" aria-modal="true">
      <div className="overlay__content">
        <h2 className="overlay__title">{isWin ? "You Win!" : "Game Over"}</h2>
        <p className="overlay__text">
          {isWin ? "You reached the 2048 tile." : "No more valid moves."}
        </p>

        <div className="overlay__actions">
          {isWin && onContinue && <Button onClick={onContinue}>Continue</Button>}
          {!isWin && canUndo && onUndo && <Button onClick={onUndo}>Undo</Button>}
          <Button onClick={onNewGame}>New Game</Button>
        </div>
      </div>
    </div>
  )
}
