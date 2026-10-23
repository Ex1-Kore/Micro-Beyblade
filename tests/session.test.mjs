import test from "node:test";
import assert from "node:assert/strict";
import {
  signSessionToken,
  verifySessionToken,
  SESSION_MAX_AGE_SECONDS,
} from "../lib/security/session.ts";

const SECRET = "test-secret-0123456789abcdef";
const OTHER_SECRET = "other-secret-9876543210zyxw";
const NOW = 1_800_000_000;

test("sign + verify roundtrip returns payload", () => {
  const token = signSessionToken("user-1", SECRET, NOW + 3600);
  const payload = verifySessionToken(token, SECRET, NOW);
  assert.ok(payload);
  assert.equal(payload.u, "user-1");
  assert.equal(payload.e, NOW + 3600);
});

test("tampered signature is rejected", () => {
  const token = signSessionToken("user-1", SECRET, NOW + 3600);
  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
  assert.equal(verifySessionToken(tampered, SECRET, NOW), null);
});

test("tampered payload is rejected", () => {
  const token = signSessionToken("user-1", SECRET, NOW + 3600);
  const [body, sig] = token.split(".");
  const forgedBody = Buffer.from(
    JSON.stringify({ u: "attacker", e: NOW + 3600 })
  ).toString("base64url");
  assert.equal(verifySessionToken(`${forgedBody}.${sig}`, SECRET, NOW), null);
  assert.ok(body);
});

test("expired token is rejected", () => {
  const token = signSessionToken("user-1", SECRET, NOW - 1);
  assert.equal(verifySessionToken(token, SECRET, NOW), null);
});

test("wrong secret is rejected", () => {
  const token = signSessionToken("user-1", SECRET, NOW + 3600);
  assert.equal(verifySessionToken(token, OTHER_SECRET, NOW), null);
});

test("missing secret fails closed", () => {
  const token = signSessionToken("user-1", SECRET, NOW + 3600);
  assert.equal(verifySessionToken(token, undefined, NOW), null);
  assert.equal(verifySessionToken(token, "", NOW), null);
});

test("garbage tokens are rejected", () => {
  assert.equal(verifySessionToken(undefined, SECRET, NOW), null);
  assert.equal(verifySessionToken("", SECRET, NOW), null);
  assert.equal(verifySessionToken("no-dot", SECRET, NOW), null);
  assert.equal(verifySessionToken(".sig", SECRET, NOW), null);
  assert.equal(verifySessionToken("body.", SECRET, NOW), null);
  assert.equal(
    verifySessionToken("eyJ1IjoidXNlci0xIn0.notbase64!!", SECRET, NOW),
    null
  );
});

test("signing without secret throws (fail closed)", () => {
  assert.throws(() => signSessionToken("user-1", "", NOW + 3600));
});

test("session max age is 7 days", () => {
  assert.equal(SESSION_MAX_AGE_SECONDS, 60 * 60 * 24 * 7);
});
