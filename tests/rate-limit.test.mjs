import test from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  clearRateLimits,
  MAX_ENTRIES,
  resetRateLimit,
} from "../lib/security/rate-limit.ts";

test("allows requests up to the limit within a window", () => {
  clearRateLimits();
  const key = "test:window";
  const first = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 2);
  const second = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 1);
  const third = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);
});

test("blocks requests over the limit and reports retry-after", () => {
  clearRateLimits();
  const key = "test:bucket";
  for (let i = 0; i < 3; i++) {
    checkRateLimit(key, { limit: 3, windowMs: 60_000 });
  }
  const blocked = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterMs > 0 && blocked.retryAfterMs <= 60_000);
});

test("keys are independent buckets", () => {
  clearRateLimits();
  const a = checkRateLimit("test:a", { limit: 1, windowMs: 60_000 });
  const b = checkRateLimit("test:b", { limit: 1, windowMs: 60_000 });
  assert.equal(a.allowed, true);
  assert.equal(b.allowed, true);
});

test("window resets and allows again after it passes", async () => {
  clearRateLimits();
  const key = "test:reset";
  checkRateLimit(key, { limit: 1, windowMs: 10 });
  await new Promise((resolve) => setTimeout(resolve, 25));
  const after = checkRateLimit(key, { limit: 1, windowMs: 10 });
  assert.equal(after.allowed, true);
});

test("clearRateLimits resets the store", () => {
  const key = "test:clear";
  checkRateLimit(key, { limit: 1, windowMs: 60_000 });
  clearRateLimits();
  const again = checkRateLimit(key, { limit: 1, windowMs: 60_000 });
  assert.equal(again.allowed, true);
});

test("resetRateLimit clears a single bucket", () => {
  clearRateLimits();
  const key = "test:reset-single";
  checkRateLimit(key, { limit: 1, windowMs: 60_000 });
  assert.equal(checkRateLimit(key, { limit: 1, windowMs: 60_000 }).allowed, false);

  resetRateLimit(key);
  assert.equal(checkRateLimit(key, { limit: 1, windowMs: 60_000 }).allowed, true);

  const other = "test:reset-single-other";
  checkRateLimit(other, { limit: 1, windowMs: 60_000 });
  resetRateLimit(key);
  assert.equal(checkRateLimit(other, { limit: 1, windowMs: 60_000 }).allowed, false);
});

test("limit 0 disables rate limiting", () => {
  clearRateLimits();
  const key = "test:off";
  for (let i = 0; i < 5; i++) {
    const result = checkRateLimit(key, { limit: 0, windowMs: 60_000 });
    assert.equal(result.allowed, true);
  }
});

test("invalid options fall back to defaults", () => {
  clearRateLimits();
  const key = "test:defaults";
  checkRateLimit(key, { limit: -1, windowMs: -1 });
  const result = checkRateLimit(key);
  assert.equal(result.allowed, true);
});

test("store growth is hard-capped for new buckets", async () => {
  clearRateLimits();
  const windowMs = 100;
  for (let i = 0; i < MAX_ENTRIES; i++) {
    checkRateLimit(`test:hc:${i}`, { limit: 1, windowMs });
  }

  const denied = checkRateLimit("test:hc:overflow", { limit: 1, windowMs });
  assert.equal(denied.allowed, false, "new bucket must be refused when the store is full");
  assert.ok(denied.retryAfterMs > 0);

  await new Promise((resolve) => setTimeout(resolve, windowMs + 20));

  const accepted = checkRateLimit("test:hc:after", { limit: 1, windowMs });
  assert.equal(accepted.allowed, true, "pruned store must accept new buckets again");
});