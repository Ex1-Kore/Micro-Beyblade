import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAllowedArchiveUrl,
  isDisallowedAddress,
} from "../lib/extensions/url-guard.ts";

test("private and reserved IPv4 addresses are rejected", () => {
  for (const address of [
    "0.0.0.0",
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "100.64.0.1",
    "224.0.0.1",
    "255.255.255.255",
  ]) {
    assert.equal(isDisallowedAddress(address), true, `${address} should be disallowed`);
  }
});

test("public IPv4 addresses are allowed", () => {
  for (const address of ["8.8.8.8", "1.1.1.1", "93.184.216.34"]) {
    assert.equal(isDisallowedAddress(address), false, `${address} should be allowed`);
  }
});

test("private and reserved IPv6 addresses are rejected", () => {
  for (const address of ["::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1"]) {
    assert.equal(isDisallowedAddress(address), true, `${address} should be disallowed`);
  }
});

test("non-IP values are treated as disallowed", () => {
  assert.equal(isDisallowedAddress("example.com"), true);
  assert.equal(isDisallowedAddress(""), true);
});

test("non-https archive URLs are rejected", () => {
  assert.throws(() => assertAllowedArchiveUrl("http://example.com/x.zip"));
  assert.throws(() => assertAllowedArchiveUrl("ftp://example.com/x.zip"));
  assert.throws(() => assertAllowedArchiveUrl("not a url"));
});

test("https archive URLs on public hosts are accepted", () => {
  const url = assertAllowedArchiveUrl("https://example.com/extensions/demo.zip");
  assert.equal(url.hostname, "example.com");
});

test("https archive URLs on private hosts are rejected", () => {
  assert.throws(() => assertAllowedArchiveUrl("https://127.0.0.1/x.zip"));
  assert.throws(() => assertAllowedArchiveUrl("https://192.168.1.10/x.zip"));
  assert.throws(() => assertAllowedArchiveUrl("https://[::1]/x.zip"));
});

test("EXTENSIONS_ALLOWED_HOSTS bypasses the public-https guard", () => {
  const previous = process.env.EXTENSIONS_ALLOWED_HOSTS;
  process.env.EXTENSIONS_ALLOWED_HOSTS = "internal.test, artifacts.example";
  try {
    assert.equal(assertAllowedArchiveUrl("http://internal.test/x.zip").hostname, "internal.test");
    assert.equal(assertAllowedArchiveUrl("http://artifacts.example/x.zip").hostname, "artifacts.example");
  } finally {
    if (previous === undefined) delete process.env.EXTENSIONS_ALLOWED_HOSTS;
    else process.env.EXTENSIONS_ALLOWED_HOSTS = previous;
  }
});
