import { useEffect } from "react"
import type { Direction } from "../game/types"

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
}

export function useKeyboardControls(onMove: (direction: Direction) => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const direction = KEY_TO_DIRECTION[event.key]
      if (!direction) return
      event.preventDefault() // stop the page from scrolling on arrow keys.
      onMove(direction)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onMove])
}
