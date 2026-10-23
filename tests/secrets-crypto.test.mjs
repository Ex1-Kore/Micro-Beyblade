import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as secrets from "../lib/security/secrets.ts";

describe("lib/security/secrets.ts — encryptSecret / decryptSecret", () => {
  const originalKey = process.env.APP_ENCRYPTION_KEY;

  before(() => {
    if (originalKey) delete process.env.APP_ENCRYPTION_KEY;
  });

  after(() => {
    if (originalKey) process.env.APP_ENCRYPTION_KEY = originalKey;
  });

  beforeEach(() => {
    delete process.env.APP_ENCRYPTION_KEY;
  });

  test("throws when APP_ENCRYPTION_KEY is not set", () => {
    assert.throws(() => secrets.encryptSecret("test"), {
      message: "APP_ENCRYPTION_KEY is required to store encrypted secrets.",
    });
    assert.throws(() => secrets.decryptSecret("x.y.z"), {
      message: "APP_ENCRYPTION_KEY is required to store encrypted secrets.",
    });
  });

  test("encryptSecret returns a three-part base64 payload", () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const payload = secrets.encryptSecret("hello world");
    const parts = payload.split(".");
    assert.strictEqual(parts.length, 3);
    parts.forEach((p) => assert.ok(p.length > 0, "each part non-empty"));
  });

  test("round-trip: decryptSecret(encryptSecret(x)) === x", () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const plaintext = "secret-value-with-unicode-🔐";
    const encrypted = secrets.encryptSecret(plaintext);
    const decrypted = secrets.decryptSecret(encrypted);
    assert.strictEqual(decrypted, plaintext);
  });

  test("different plaintexts produce different ciphertexts (IV randomness)", () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const a = secrets.encryptSecret("same");
    const b = secrets.encryptSecret("same");
    assert.notStrictEqual(a, b, "IV must be random per encryption");
  });

  test("tampered ciphertext throws on decrypt", () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const encrypted = secrets.encryptSecret("tamper-test");
    const parts = encrypted.split(".");
    // Corrupt the data part (ciphertext) by flipping a bit in base64
    const dataBytes = Buffer.from(parts[2], "base64");
    dataBytes[0] ^= 0xff; // flip all bits of first byte
    const corruptedData = dataBytes.toString("base64");
    const tampered = `${parts[0]}.${parts[1]}.${corruptedData}`;
    assert.throws(() => secrets.decryptSecret(tampered));
  });

  test("invalid payload format throws", () => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    assert.throws(() => secrets.decryptSecret("not-a-valid-payload"));
    assert.throws(() => secrets.decryptSecret("a.b"));
    assert.throws(() => secrets.decryptSecret(""));
  });
});