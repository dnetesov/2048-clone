import { Button } from "./Button"
import { ScoreCard } from "./ScoreCard"

type HeaderProps = {
  score: number
  bestScore: number
  onNewGame: () => void
}

export function Header({ score, bestScore, onNewGame }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="app-title">2048</h1>

      <div className="header__scores">
        <ScoreCard dark label="Score" value={score} />
        <ScoreCard label="Best" value={bestScore} />
      </div>

      <Button onClick={onNewGame}>New Game</Button>
    </header>
  )
}
