import test from "node:test";
import assert from "node:assert/strict";
import { clearRateLimits, resetRateLimit } from "../lib/security/rate-limit.ts";
import {
  checkLoginLimit,
  loginBucketKeys,
  loginLimitConfig,
  resetLoginLimit,
} from "../lib/security/login-limit.ts";

const CFG = {
  ipLimit: 3,
  ipWindowMs: 60_000,
  accountLimit: 2,
  accountWindowMs: 60_000,
};

test("login buckets are independent per IP and per account", () => {
  clearRateLimits();
  const sameIp = { ip: "1.2.3.4", username: "alice" };
  assert.equal(checkLoginLimit(sameIp, CFG).allowed, true);
  assert.equal(checkLoginLimit(sameIp, CFG).allowed, true); // acct limit (2) reached
  assert.equal(checkLoginLimit(sameIp, CFG).allowed, false); // next blocked

  const otherIp = { ip: "5.6.7.8", username: "alice" };
  assert.equal(checkLoginLimit(otherIp, CFG).allowed, false); // account bucket shared

  const otherAcct = { ip: "1.2.3.4", username: "bob" };
  assert.equal(checkLoginLimit(otherAcct, CFG).allowed, false); // ip bucket shared
});

test("account key is case and whitespace normalized", () => {
  const a = loginBucketKeys("ip", "  Admin ");
  const b = loginBucketKeys("ip", "admin");
  assert.equal(a.accountKey, b.accountKey);
});

test("blocked attempt reports a retry-after", () => {
  clearRateLimits();
  const params = { ip: "1.2.3.4", username: "alice" };
  checkLoginLimit(params, CFG);
  checkLoginLimit(params, CFG);
  const blocked = checkLoginLimit(params, CFG);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0 && blocked.retryAfterMs <= 60_000);
});

test("resetLoginLimit clears the account bucket only", () => {
  clearRateLimits();
  const params = { ip: "1.2.3.4", username: "alice" };
  checkLoginLimit(params, CFG);
  checkLoginLimit(params, CFG);
  assert.equal(checkLoginLimit(params, CFG).allowed, false);

  resetLoginLimit("alice");
  assert.equal(
    checkLoginLimit({ ip: "9.9.9.9", username: "alice" }, CFG).allowed,
    true,
    "account bucket must be clear after reset"
  );
  assert.equal(
    checkLoginLimit({ ip: "1.2.3.4", username: "bob" }, CFG).allowed,
    false,
    "ip bucket must not be reset by an account reset"
  );
});

test("limit 0 disables rate limiting", () => {
  clearRateLimits();
  const cfg = { ipLimit: 0, ipWindowMs: 60_000, accountLimit: 0, accountWindowMs: 60_000 };
  const params = { ip: "1.2.3.4", username: "alice" };
  for (let i = 0; i < 5; i++) {
    assert.equal(checkLoginLimit(params, cfg).allowed, true);
  }
});

test("missing ip/username map to known buckets instead of colliding", () => {
  clearRateLimits();
  const a = loginBucketKeys("", "");
  const b = loginBucketKeys(undefined, undefined);
  assert.deepEqual(a, b);
  assert.match(a.ipKey, /unknown/);
  assert.match(a.accountKey, /unknown/);
});

test("loginLimitConfig reads env (defaults when unset)", () => {
  const before = loginLimitConfig();
  assert.equal(before.ipLimit, 10);
  assert.equal(before.accountLimit, 5);

  process.env.LOGIN_ACCOUNT_LIMIT_MAX = "12";
  const after = loginLimitConfig();
  assert.equal(after.accountLimit, 12);
  delete process.env.LOGIN_ACCOUNT_LIMIT_MAX;
});

test("IP-blocked attempts do not consume the account bucket", () => {
  clearRateLimits();
  const cfg = { ipLimit: 2, ipWindowMs: 60_000, accountLimit: 5, accountWindowMs: 60_000 };
  const params = { ip: "10.0.0.9", username: "Tharn@Example.com" };
  const keys = loginBucketKeys(params.ip, params.username);

  assert.equal(checkLoginLimit(params, cfg).allowed, true);
  assert.equal(checkLoginLimit(params, cfg).allowed, true);
  assert.equal(checkLoginLimit(params, cfg).allowed, false, "IP bucket must block at the limit");

  resetRateLimit(keys.ipKey);

  // Reset the IP bucket before every attempt from here on so that only the
  // account bucket can block. If the IP-blocked attempt had ticked the
  // account bucket, only 2 of these 3 would be allowed (account 3, 4, 5).
  for (let i = 0; i < 3; i++) {
    resetRateLimit(keys.ipKey);
    assert.equal(
      checkLoginLimit(params, cfg).allowed,
      true,
      `account ${3 + i} must still fit — blocked attempt must not have ticked it`
    );
  }
  resetRateLimit(keys.ipKey);
  assert.equal(checkLoginLimit(params, cfg).allowed, false, "account bucket must block at the limit");
});