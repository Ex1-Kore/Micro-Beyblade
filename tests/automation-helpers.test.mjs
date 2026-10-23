import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeNextDailyRun, slugify, stripHtml } from "../lib/automation/helpers.ts";

describe("lib/automation/helpers.ts — computeNextDailyRun", () => {
  const fixedFrom = new Date("2026-10-10T12:00:00Z");

  test("same day if schedule time is in the future", () => {
    const next = computeNextDailyRun("15:30", "UTC", fixedFrom);
    const expected = new Date("2026-10-10T15:30:00Z");
    assert.strictEqual(next.getTime(), expected.getTime());
  });

  test("next day if schedule time already passed", () => {
    const next = computeNextDailyRun("09:00", "UTC", fixedFrom);
    const expected = new Date("2026-10-11T09:00:00Z");
    assert.strictEqual(next.getTime(), expected.getTime());
  });

  test("timezone shift: Bangkok (UTC+7)", () => {
    const fromBKK = new Date("2026-10-10T05:00:00Z"); // 12:00 Bangkok
    const next = computeNextDailyRun("14:00", "Asia/Bangkok", fromBKK);
    const expected = new Date("2026-10-10T07:00:00Z"); // 14:00 BKK = 07:00 UTC
    assert.strictEqual(next.getTime(), expected.getTime());
  });

  test("throws or returns invalid date when scheduleTime malformed", () => {
    // "invalid" -> hour=NaN, minute=NaN -> function throws RangeError or returns invalid date
    assert.throws(() => computeNextDailyRun("invalid", "UTC", fixedFrom), RangeError);
  });

  test("defaults to 09:00 when minute missing", () => {
    const next = computeNextDailyRun("14:", "UTC", fixedFrom);
    const expected = new Date("2026-10-10T14:00:00Z");
    assert.strictEqual(next.getTime(), expected.getTime());
  });
});

describe("lib/automation/helpers.ts — slugify", () => {
  test("lowercases and replaces spaces with hyphens", () => {
    assert.strictEqual(slugify("Hello World"), "hello-world");
  });

  test("removes non-alphanumeric except hyphen", () => {
    assert.strictEqual(slugify("Test@#$%^&*()!"), "test");
  });

  test("collapses multiple hyphens", () => {
    assert.strictEqual(slugify("a---b   c"), "a-b-c");
  });

  test("trims leading/trailing hyphens", () => {
    assert.strictEqual(slugify("  leading and trailing  "), "leading-and-trailing");
  });

  test("empty string returns empty", () => {
    assert.strictEqual(slugify(""), "");
  });
});

describe("lib/automation/helpers.ts — stripHtml", () => {
  test("removes HTML tags", () => {
    assert.strictEqual(stripHtml("<p>Hello <b>World</b></p>"), "Hello World");
  });

  test("collapses whitespace", () => {
    assert.strictEqual(stripHtml("<div>  spaced   out  </div>"), "spaced out");
  });

  test("handles nested tags", () => {
    assert.strictEqual(stripHtml("<div><span>nested</span></div>"), "nested");
  });

  test("empty string returns empty", () => {
    assert.strictEqual(stripHtml(""), "");
  });

  test("plain text unchanged", () => {
    assert.strictEqual(stripHtml("no tags here"), "no tags here");
  });
});