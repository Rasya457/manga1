// src/lib/rateLimiter.ts
// Simple in-memory rate limiter for API routes.
// For production at scale, replace with Redis/Upstash.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Returns true if the request is ALLOWED, false if the limit is exceeded.
 * @param key     Unique identifier for the client (e.g. IP address, uid)
 * @param limit   Max requests allowed in the window
 * @param windowMs  Duration of the window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request in this window (or window has expired)
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  entry.count += 1;
  return true;
}

/** Returns seconds until the rate limit resets for a given key */
export function retryAfter(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  return Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000));
}
