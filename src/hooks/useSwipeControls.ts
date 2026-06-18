import { useEffect, type RefObject } from "react"
import type { Direction } from "../game/types"

/** Minimum travel (px) before a touch gesture counts as a swipe. */
const SWIPE_THRESHOLD = 30

/**
 * Adds basic touch-swipe support to a board element. The dominant axis of the
 * gesture determines the direction, so diagonal swipes resolve to the larger
 * component.
 */
export function useSwipeControls(
  ref: RefObject<HTMLElement | null>,
  onMove: (direction: Direction) => void,
): void {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    let startX = 0
    let startY = 0

    function handleTouchStart(event: TouchEvent) {
      const touch = event.changedTouches[0]
      startX = touch.clientX
      startY = touch.clientY
    }

    function handleTouchEnd(event: TouchEvent) {
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (Math.max(absX, absY) < SWIPE_THRESHOLD) return

      if (absX > absY) {
        onMove(deltaX > 0 ? "right" : "left")
      } else {
        onMove(deltaY > 0 ? "down" : "up")
      }
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [ref, onMove])
}
