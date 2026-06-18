import { useEffect } from "react"
import type { GameAction } from "../game/types"

type Dispatch = (action: GameAction) => void

const CHEAT_CODES: Record<string, GameAction> = {
  showtiles: { type: "CHEAT_SHOWCASE" },
  win2048: { type: "CHEAT_READY_TO_WIN" },
}

function cheatsEnabled(): boolean {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).has("cheats")
}

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function useCheatCodes(dispatch: Dispatch): void {
  useEffect(() => {
    if (!cheatsEnabled()) return

    let buffer = ""
    const maxCodeLength = Math.max(...Object.keys(CHEAT_CODES).map((code) => code.length))

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTextInput(event.target) || event.key.length !== 1) return

      buffer = `${buffer}${event.key.toLowerCase()}`.slice(-maxCodeLength)

      for (const [code, action] of Object.entries(CHEAT_CODES)) {
        if (buffer.endsWith(code)) {
          dispatch(action)
          buffer = ""
          break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [dispatch])
}
