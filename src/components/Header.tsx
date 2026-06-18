import Logo from "../../public/logo.svg?react"
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
      <Logo className="logo" role="img" aria-label="Bluedot 2048" />

      <div className="header__scores">
        <ScoreCard dark label="Score" value={score} />
        <ScoreCard label="Best" value={bestScore} />
      </div>

      <Button onClick={onNewGame}>New Game</Button>
    </header>
  )
}
