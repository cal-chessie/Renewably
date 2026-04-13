// ============================================================================
// RENEWABLY.IE — REDIS CLIENT
// ============================================================================
import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null // stop retrying
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true, // don't crash if Redis isn't available during dev
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
