/**
 * Simple in-memory combo tracker for practice sessions.
 * Combos reset after 10 seconds of inactivity (configurable).
 */

const MAX_COMBO = 5
const COMBO_TIMEOUT_MS = 10_000

interface ComboState {
  count: number
  lastTime: number
}

const combos = new Map<string, ComboState>()

/**
 * Increment the combo counter for a session.
 * Returns the new combo count (max 5x).
 * Resets if more than COMBO_TIMEOUT_MS since last increment.
 */
export function incrementCombo(sessionId: string): number {
  const now = Date.now()
  const existing = combos.get(sessionId)

  if (!existing || now - existing.lastTime > COMBO_TIMEOUT_MS) {
    combos.set(sessionId, { count: 1, lastTime: now })
    return 1
  }

  const newCount = Math.min(existing.count + 1, MAX_COMBO)
  combos.set(sessionId, { count: newCount, lastTime: now })
  return newCount
}

/**
 * Reset the combo counter for a session.
 */
export function resetCombo(sessionId: string): void {
  combos.delete(sessionId)
}

/**
 * Get the current combo count for a session.
 */
export function getCombo(sessionId: string): number {
  const existing = combos.get(sessionId)
  if (!existing) return 0

  // Auto-reset if expired
  if (Date.now() - existing.lastTime > COMBO_TIMEOUT_MS) {
    combos.delete(sessionId)
    return 0
  }

  return existing.count
}
