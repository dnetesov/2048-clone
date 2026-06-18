import { BEST_SCORE_STORAGE_KEY } from "./constants"

export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_STORAGE_KEY)
    if (raw === null) return 0
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  } catch {
    return 0
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(score))
  } catch {
    // Ignore
  }
}
