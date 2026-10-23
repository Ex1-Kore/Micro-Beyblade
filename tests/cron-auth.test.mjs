import test from "node:test";
import assert from "node:assert/strict";
import { isCronAuthorized } from "../lib/automation/cron-auth.ts";

function headers(map) {
  return { get: (name) => map[name.toLowerCase()] ?? null };
}

test("fail-closed: missing secret rejects every request", () => {
  assert.equal(isCronAuthorized(headers({ "x-automation-token": "anything" }), undefined), false);
  assert.equal(isCronAuthorized(headers({ "x-automation-token": "anything" }), ""), false);
  assert.equal(isCronAuthorized(headers({ "x-automation-token": "anything" }), "   "), false);
});

test("fail-closed: missing token rejects", () => {
  assert.equal(isCronAuthorized(headers({}), "secret-value"), false);
  assert.equal(isCronAuthorized(headers({ authorization: "Bearer" }), "secret-value"), false);
});

test("valid x-automation-token passes", () => {
  assert.equal(
    isCronAuthorized(headers({ "x-automation-token": "secret-value" }), "secret-value"),
    true
  );
});

test("valid Authorization Bearer passes (case-insensitive scheme)", () => {
  assert.equal(
    isCronAuthorized(headers({ authorization: "Bearer secret-value" }), "secret-value"),
    true
  );
  assert.equal(
    isCronAuthorized(headers({ authorization: "bearer secret-value" }), "secret-value"),
    true
  );
});

test("wrong token is rejected", () => {
  assert.equal(
    isCronAuthorized(headers({ "x-automation-token": "wrong" }), "secret-value"),
    false
  );
  assert.equal(
    isCronAuthorized(headers({ authorization: "Bearer wrong" }), "secret-value"),
    false
  );
});

test("secret with surrounding whitespace is normalized", () => {
  assert.equal(
    isCronAuthorized(headers({ "x-automation-token": "secret-value" }), "  secret-value "),
    true
  );
});
