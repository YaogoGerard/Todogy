import type { Context, MiddlewareHandler } from 'hono'

interface RateLimitOptions {
  windowMs: number
  max: number
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const CLEANUP_INTERVAL_MS = 60_000

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}, CLEANUP_INTERVAL_MS)

function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return 'unknown'
}

// Test-only helper so each test case starts with a clean slate.
export function resetRateLimits() {
  buckets.clear()
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, max } = options

  return async (c, next) => {
    const key = `${clientIp(c)}:${c.req.path}`
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
    } else {
      bucket.count += 1
      if (bucket.count > max) {
        return c.json({ error: 'Too many requests. Please try again later.' }, 429)
      }
    }

    await next()
  }
}