import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAllowedOrigins,
  resolveCorsOrigin,
} from "../lib/security/cors-policy.ts";

test("parse: empty/undefined yields empty list", () => {
  assert.deepEqual(parseAllowedOrigins(undefined), []);
  assert.deepEqual(parseAllowedOrigins(""), []);
  assert.deepEqual(parseAllowedOrigins("   "), []);
  assert.deepEqual(parseAllowedOrigins(null), []);
});

test("parse: trims, drops trailing slash, splits on comma", () => {
  assert.deepEqual(
    parseAllowedOrigins(" https://a.example.com , http://localhost:5173/ "),
    ["https://a.example.com", "http://localhost:5173"]
  );
});

test("parse: wildcard entries are dropped (never supported)", () => {
  assert.deepEqual(parseAllowedOrigins("*, https://ok.example.com"), [
    "https://ok.example.com",
  ]);
});

test("resolve: exact match passes", () => {
  const allowed = parseAllowedOrigins("https://a.example.com");
  assert.equal(
    resolveCorsOrigin("https://a.example.com", allowed),
    "https://a.example.com"
  );
});

test("resolve: trailing slash on request origin is normalized", () => {
  const allowed = parseAllowedOrigins("https://a.example.com");
  assert.equal(
    resolveCorsOrigin("https://a.example.com/", allowed),
    "https://a.example.com"
  );
});

test("resolve: unknown origin is rejected", () => {
  const allowed = parseAllowedOrigins("https://a.example.com");
  assert.equal(resolveCorsOrigin("https://evil.example.com", allowed), null);
  assert.equal(resolveCorsOrigin("https://a.example.com.evil.com", allowed), null);
});

test("resolve: null/missing origin yields null (no header set)", () => {
  assert.equal(resolveCorsOrigin(null, ["https://a.example.com"]), null);
  assert.equal(resolveCorsOrigin(undefined, ["https://a.example.com"]), null);
  assert.equal(resolveCorsOrigin("", ["https://a.example.com"]), null);
});

test("resolve: empty allowlist rejects everything", () => {
  assert.equal(resolveCorsOrigin("https://a.example.com", []), null);
});
