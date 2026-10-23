import test from "node:test";
import assert from "node:assert/strict";
import { getSecretFeatureStatus } from "../lib/system/secret-readiness.ts";

function withEnv(value, fn) {
  const previous = process.env.APP_ENCRYPTION_KEY;
  if (value === undefined) delete process.env.APP_ENCRYPTION_KEY;
  else process.env.APP_ENCRYPTION_KEY = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.APP_ENCRYPTION_KEY;
    else process.env.APP_ENCRYPTION_KEY = previous;
  }
}

test("reports not ready when APP_ENCRYPTION_KEY is unset", () => {
  withEnv(undefined, () => {
    const status = getSecretFeatureStatus();
    assert.equal(status.ready, false);
    assert.match(status.message, /APP_ENCRYPTION_KEY/);
  });
});

test("reports not ready when APP_ENCRYPTION_KEY is blank", () => {
  withEnv("   ", () => {
    const status = getSecretFeatureStatus();
    assert.equal(status.ready, false);
    assert.match(status.message, /APP_ENCRYPTION_KEY/);
  });
});

test("reports ready when APP_ENCRYPTION_KEY is set", () => {
  withEnv("a-real-key-value", () => {
    const status = getSecretFeatureStatus();
    assert.equal(status.ready, true);
    assert.equal(status.message, "Secret storage is ready.");
  });
});

test("never throws regardless of environment state", () => {
  withEnv(undefined, () => {
    assert.doesNotThrow(() => getSecretFeatureStatus());
  });
});
