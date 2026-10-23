/**
 * Brute-force protection for the login endpoint.
 *
 * Two independent fixed-window buckets are checked per attempt:
 *   - per client IP, to slow distributed guessing from one source
 *   - per username, to protect a single account regardless of source
 *
 * Backed by `rate-limit.ts` (in-memory, per process). On serverless
 * runtimes the window is per-isolate — a useful bound, not a substitute
 * for platform-level protection.
 */

import { checkRateLimit, resetRateLimit } from "./rate-limit.ts";

export interface LoginLimitConfig {
  ipLimit: number;
  ipWindowMs: number;
  accountLimit: number;
  accountWindowMs: number;
}

export interface LoginLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const DEFAULT_IP_LIMIT = 10;
const DEFAULT_IP_WINDOW_MS = 15 * 60_000;
const DEFAULT_ACCOUNT_LIMIT = 5;
const DEFAULT_ACCOUNT_WINDOW_MS = 15 * 60_000;

function nonNegativeIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

export function loginLimitConfig(): LoginLimitConfig {
  return {
    ipLimit: nonNegativeIntEnv("LOGIN_RATE_LIMIT_MAX", DEFAULT_IP_LIMIT),
    ipWindowMs: nonNegativeIntEnv("LOGIN_RATE_LIMIT_WINDOW_MS", DEFAULT_IP_WINDOW_MS),
    accountLimit: nonNegativeIntEnv("LOGIN_ACCOUNT_LIMIT_MAX", DEFAULT_ACCOUNT_LIMIT),
    accountWindowMs: nonNegativeIntEnv("LOGIN_ACCOUNT_LIMIT_WINDOW_MS", DEFAULT_ACCOUNT_WINDOW_MS),
  };
}

export function loginBucketKeys(
  ip: string,
  username: string
): { ipKey: string; accountKey: string } {
  const account = (username ?? "").trim().toLowerCase();
  return {
    ipKey: `login:ip:${ip || "unknown"}`,
    accountKey: `login:acct:${account || "unknown"}`,
  };
}

/**
 * Records an attempt against both buckets. Call once per POST before
 * verifying credentials. When blocked, no attempt is recorded against a
 * bucket that is already over its limit.
 */
export function checkLoginLimit(
  params: { ip: string; username: string },
  config: LoginLimitConfig = loginLimitConfig()
): LoginLimitResult {
  const { ipKey, accountKey } = loginBucketKeys(params.ip, params.username);

  const ip = checkRateLimit(ipKey, { limit: config.ipLimit, windowMs: config.ipWindowMs });
  if (!ip.allowed) {
    // Short-circuit on the IP bucket: do not tick the shared account bucket
    // for attempts that are already blocked at the client level.
    return { allowed: false, retryAfterMs: ip.retryAfterMs };
  }

  const account = checkRateLimit(accountKey, {
    limit: config.accountLimit,
    windowMs: config.accountWindowMs,
  });

  return {
    allowed: account.allowed,
    retryAfterMs: account.allowed ? 0 : account.retryAfterMs,
  };
}

/** Clears the per-account bucket after a successful login. */
export function resetLoginLimit(username: string): void {
  resetRateLimit(loginBucketKeys("", username).accountKey);
}
