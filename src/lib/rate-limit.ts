/**
 * Simple in-memory rate limiter for comments.
 * Tracks timestamps per user; auto-cleans expired entries every 5 minutes.
 */

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 5

const store = new Map<string, number[]>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((timestamps, key) => {
    const valid = timestamps.filter((t: number) => now - t < WINDOW_MS)
    if (valid.length === 0) {
      store.delete(key)
    } else {
      store.set(key, valid)
    }
  })
}, 5 * 60_000)

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const timestamps = store.get(userId) ?? []
  const valid = timestamps.filter(t => now - t < WINDOW_MS)

  if (valid.length >= MAX_REQUESTS) {
    const oldest = valid[0]
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) }
  }

  valid.push(now)
  store.set(userId, valid)
  return { allowed: true }
}
