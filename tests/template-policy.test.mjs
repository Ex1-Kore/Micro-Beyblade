import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CMS_TEMPLATE_API_VERSION,
  sanitizeTemplateId,
  validateTemplateManifest,
} from "../lib/templates/validator.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function validManifest(overrides = {}) {
  return {
    id: "aurora",
    name: "Aurora",
    version: "0.1.0",
    apiVersion: "1",
    kind: "theme",
    tokens: {
      primaryColor: "#4f46e5",
      accentColor: "#06b6d4",
      bgColor: "#ffffff",
      textColor: "#0f172a",
      fontFamily: "Inter, sans-serif",
      layoutStyle: "wide",
      mode: "light",
    },
    ...overrides,
  };
}

test("a complete manifest validates with no errors", () => {
  const { manifest, errors } = validateTemplateManifest(validManifest());
  assert.deepEqual(errors, []);
  assert.equal(manifest.id, "aurora");
  assert.equal(manifest.tokens.primaryColor, "#4f46e5");
  assert.equal(manifest.tokens.mode, "light");
});

test("required fields are enforced", () => {
  const { errors } = validateTemplateManifest({ id: "x" });
  assert.ok(errors.some((e) => e.includes("name")));
  assert.ok(errors.some((e) => e.includes("version")));
  assert.ok(errors.some((e) => e.includes("apiVersion")));
});

test("unsupported apiVersion is rejected", () => {
  const { errors } = validateTemplateManifest(validManifest({ apiVersion: "2" }));
  assert.ok(errors.some((e) => e.includes("Unsupported apiVersion")));
  assert.equal(CMS_TEMPLATE_API_VERSION, "1");
});

test("template id must be lowercase slug", () => {
  const { errors } = validateTemplateManifest(validManifest({ id: "Aurora Theme" }));
  assert.ok(errors.some((e) => e.includes("lowercase")));
});

test("unknown kind is rejected", () => {
  const { errors } = validateTemplateManifest(validManifest({ kind: "plugin" }));
  assert.ok(errors.some((e) => e.includes("Unsupported kind")));
});

test("non-hex color tokens are rejected", () => {
  const { manifest, errors } = validateTemplateManifest(
    validManifest({ tokens: { primaryColor: "red", accentColor: "#zzz" } }),
  );
  assert.equal(errors.length, 2);
  assert.equal(manifest.tokens.primaryColor, undefined);
  assert.equal(manifest.tokens.accentColor, undefined);
});

test("layoutStyle and mode are constrained to allowed values", () => {
  const { errors } = validateTemplateManifest(
    validManifest({ tokens: { layoutStyle: "huge", mode: "sepia" } }),
  );
  assert.ok(errors.some((e) => e.includes("layoutStyle")));
  assert.ok(errors.some((e) => e.includes("mode")));
});

test("fontFamily rejects characters that could inject CSS", () => {
  const { errors } = validateTemplateManifest(
    validManifest({ tokens: { fontFamily: 'Inter;}</style><script>alert(1)</script>' } }),
  );
  assert.ok(errors.some((e) => e.includes("fontFamily")));
});

test("previewImage must be a safe relative path", () => {
  const { errors } = validateTemplateManifest(validManifest({ previewImage: "https://evil.example/x.png" }));
  assert.ok(errors.some((e) => e.includes("previewImage")));

  const traversal = validateTemplateManifest(validManifest({ previewImage: "../../etc/passwd" }));
  assert.ok(traversal.errors.some((e) => e.includes("previewImage")));
});

test("non-object manifests are rejected", () => {
  assert.deepEqual(validateTemplateManifest(null).errors, ["Manifest must be a JSON object."]);
  assert.deepEqual(validateTemplateManifest("x").errors, ["Manifest must be a JSON object."]);
});

test("sanitizeTemplateId normalizes arbitrary ids", () => {
  assert.equal(sanitizeTemplateId("  Aurora Theme! "), "aurora-theme-");
  assert.equal(sanitizeTemplateId("ok_id.1"), "ok_id.1");
});

test("template registry is metadata-only with a file-based active state", () => {
  const source = readFileSync(path.join(ROOT, "lib", "templates", "registry.ts"), "utf8");
  assert.ok(source.includes("loadMode: 'metadata-only'"));
  assert.ok(source.includes(".cms-template-state.json"));
  assert.ok(source.includes("activeTemplateId"));
  assert.ok(source.includes("TEMPLATES_WRITE_ENABLED"));
});

test("public active-template route never exposes filesystem paths", () => {
  const source = readFileSync(path.join(ROOT, "app", "api", "templates", "active", "route.ts"), "utf8");
  assert.equal(source.includes("directoryPath"), false);
  assert.equal(source.includes("templatesDir"), false);
});

test("admin template routes are session-guarded for writes", () => {
  for (const rel of ["app/api/admin/templates/route.ts", "app/api/admin/templates/[id]/route.ts"]) {
    const source = readFileSync(path.join(ROOT, rel), "utf8");
    assert.ok(source.includes("guardApiSession"), `${rel} must guard writes with guardApiSession`);
  }
});
