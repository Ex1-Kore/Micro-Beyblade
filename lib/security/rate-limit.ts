/**
 * In-memory fixed-window rate limiter for API routes.
 *
 * Suitable for self-hosted single-instance deployments. On serverless
 * runtimes (e.g. Vercel) the window is per-isolate — a useful sanity
 * bound, not a substitute for platform-level rate limiting.
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
export const MAX_ENTRIES = 10_000;

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/** Clears every bucket. Exposed for tests and reset tooling. */
export function clearRateLimits(): void {
  store.clear();
}

/** Clears a single bucket (e.g. after a successful login). */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = sanitizeNonNegativeInt(options.limit, DEFAULT_LIMIT);
  const windowMs = sanitizeNonNegativeInt(options.windowMs, DEFAULT_WINDOW_MS);
  const now = Date.now();

  if (limit === 0) {
    return { allowed: true, remaining: Infinity, retryAfterMs: 0 };
  }

  const entry = store.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    if (store.size >= MAX_ENTRIES && !store.has(key)) {
      pruneExpired(now, windowMs);
      if (store.size >= MAX_ENTRIES) {
        // Hard cap: even after pruning there is no room for a new bucket.
        // Fail closed instead of growing the store without bound.
        return { allowed: false, remaining: 0, retryAfterMs: windowMs };
      }
    }
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.windowStart + windowMs - now,
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

function sanitizeNonNegativeInt(
  value: number | undefined,
  fallback: number
): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 0) return fallback;
  return value;
}

function pruneExpired(now: number, windowMs: number): void {
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= windowMs) {
      store.delete(key);
    }
  }
}