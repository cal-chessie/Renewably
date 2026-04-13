// ============================================================================
// RENEWABLY.IE — GENERIC RATE LIMITER (Redis + in-memory fallback)
// ============================================================================
// Used by public API routes (contact form, chat) to prevent abuse.
// ============================================================================

let redisAvailable: boolean | null = null;

async function isRedisReady(): Promise<boolean> {
  if (redisAvailable !== null) return redisAvailable;
  try {
    const { redis } = await import('./redis');
    await redis.ping();
    redisAvailable = true;
    return true;
  } catch {
    redisAvailable = false;
    return false;
  }
}

// In-memory rate limit store: key → { count, expiresAt }
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

// Clean up expired entries periodically
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.expiresAt <= now) memoryStore.delete(key);
    }
  }, 60_000).unref();
}

export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Redis key prefix */
  prefix: string;
}

/**
 * Check if a request should be rate-limited.
 * Uses Redis first, falls back to in-memory store.
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const { maxRequests, windowMs, prefix } = config;
  const key = `${prefix}:${ip}`;

  // Try Redis first
  try {
    if (await isRedisReady()) {
      const { redis } = await import('./redis');
      const countStr = await redis.incr(key);

      if (parseInt(countStr, 10) === 1) {
        await redis.pexpire(key, windowMs);
      }

      const count = parseInt(countStr, 10);
      const ttl = await redis.pttl(key);

      if (count > maxRequests) {
        return { allowed: false, retryAfterMs: Math.max(0, ttl) };
      }
      return { allowed: true, retryAfterMs: 0 };
    }
  } catch (err) {
    console.error(`[rate-limit] Redis check failed for ${prefix}:`, err);
    redisAvailable = false;
  }

  // In-memory fallback
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  existing.count += 1;
  const retryAfterMs = existing.expiresAt - now;

  if (existing.count > maxRequests) {
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Get client IP from request (handles proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

// Pre-configured rate limiters for common use cases
export const CONTACT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 5 submissions per 15 minutes
  prefix: 'public:ratelimit:contact',
};

export const CHAT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 15 * 60 * 1000, // 20 messages per 15 minutes
  prefix: 'public:ratelimit:chat',
};
