type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export interface UserRateLimitOptions {
  key: string
  userId: string
  max: number
  windowMs: number
}

export interface UserRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkUserRateLimit(opts: UserRateLimitOptions): UserRateLimitResult {
  const now = Date.now()
  const bucketKey = `${opts.key}:${opts.userId}`
  const bucket = buckets.get(bucketKey)

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + opts.windowMs
    buckets.set(bucketKey, { count: 1, resetAt })
    return { allowed: true, remaining: opts.max - 1, resetAt }
  }

  bucket.count++
  const allowed = bucket.count <= opts.max
  return {
    allowed,
    remaining: Math.max(0, opts.max - bucket.count),
    resetAt: bucket.resetAt,
  }
}

export const AI_FEEDBACK_LIMIT = { max: 15, windowMs: 60 * 60 * 1000 }
export const AI_MICRO_LIMIT = { max: 30, windowMs: 60 * 60 * 1000 }
export const AI_CHAT_LIMIT = { max: 60, windowMs: 24 * 60 * 60 * 1000 }
