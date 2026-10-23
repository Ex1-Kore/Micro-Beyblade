import test from "node:test";
import assert from "node:assert/strict";
import {
  sniffImageType,
  inspectUpload,
  ALLOWED_UPLOAD_TYPES,
} from "../lib/security/upload-guard.ts";

const JPEG = (buf) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), buf]);
const PNG = (buf) =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), buf]);
const WEBP = (buf) =>
  Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.of(0x24, 0x00, 0x00, 0x00),
    Buffer.from("WEBP"),
    buf,
  ]);
const GIF87 = () => Buffer.from("GIF87a");
const GIF89 = () => Buffer.from("GIF89a");
const SVG = () => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

test("sniffImageType detects JPEG magic bytes", () => {
  assert.equal(sniffImageType(JPEG(Buffer.from("jpeg payload"))), "image/jpeg");
});

test("sniffImageType detects PNG magic bytes", () => {
  assert.equal(sniffImageType(PNG(Buffer.from("png payload"))), "image/png");
});

test("sniffImageType detects WebP RIFF/WEBP magic bytes", () => {
  assert.equal(sniffImageType(WEBP(Buffer.from("webp payload"))), "image/webp");
});

test("sniffImageType detects GIF87a and GIF89a", () => {
  assert.equal(sniffImageType(GIF87()), "image/gif");
  assert.equal(sniffImageType(GIF89()), "image/gif");
});

test("sniffImageType returns null for SVG or unknown content", () => {
  assert.equal(sniffImageType(SVG()), null);
  assert.equal(sniffImageType(Buffer.from("hello world")), null);
});

test("SVG is not in the upload allowlist", () => {
  assert.equal(ALLOWED_UPLOAD_TYPES.includes("image/svg+xml"), false);
});

test("inspectUpload accepts a file whose declared type matches its content", () => {
  const result = inspectUpload("image/png", PNG(Buffer.from("x")));
  assert.deepEqual(result, { allowed: true });
});

test("inspectUpload rejects a declared type that does not match the content", () => {
  const result = inspectUpload("image/jpeg", PNG(Buffer.from("x")));
  assert.deepEqual(result, {
    allowed: false,
    error: "File content does not match its declared type",
  });
});

test("inspectUpload rejects disallowed declared types", () => {
  const result = inspectUpload("image/svg+xml", SVG());
  assert.deepEqual(result, {
    allowed: false,
    error: "Unsupported file type",
  });
});

test("inspectUpload rejects empty or unknown content", () => {
  const result = inspectUpload("image/png", Buffer.from("not really a png"));
  assert.deepEqual(result, {
    allowed: false,
    error: "File content does not match its declared type",
  });
});