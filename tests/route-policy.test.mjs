import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = path.join(ROOT, "app", "api");

const PUBLIC_WRITE = new Set([
  "auth/login/route.ts",
  "auth/logout/route.ts",
  "auth/setup/route.ts",
  "system/bootstrap/route.ts",
]);

const AUTH_PROOF = [
  "guardApiSession",
  "getCurrentUser",
  "requireAuth",
  "isCronAuthorized",
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

function exportedMethods(source) {
  const methods = [];
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) methods.push(m[1]);
  return methods;
}

const routeFiles = walk(API_DIR);
const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

test("app/api has route files to audit", () => {
  assert.ok(routeFiles.length >= 25, `expected >=25 route files, got ${routeFiles.length}`);
});

test("every write endpoint is session-guarded (public auth/bootstrap allowlist)", () => {
  const violations = [];
  for (const file of routeFiles) {
    const rel = path.relative(path.join(ROOT, "app", "api"), file);
    const source = readFileSync(file, "utf8");
    const hasProof = AUTH_PROOF.some((p) => source.includes(p));
    for (const method of exportedMethods(source)) {
      if (!WRITE.has(method)) continue;
      if (PUBLIC_WRITE.has(rel)) {
        if (method === "POST" && rel === "auth/setup/route.ts" && !source.includes("needsSetup")) {
          violations.push(`${rel} POST: setup must check needsSetup`);
        }
        continue;
      }
      if (!hasProof) violations.push(`${rel} ${method}: no auth proof`);
    }
  }
  assert.deepEqual(violations, []);
});

test("every /api/admin endpoint is guarded (including GET)", () => {
  const violations = [];
  for (const file of routeFiles) {
    const rel = path.relative(path.join(ROOT, "app", "api"), file);
    if (!rel.startsWith("admin" + path.sep)) continue;
    const source = readFileSync(file, "utf8");
    if (rel === path.join("admin", "automation", "cron", "route.ts")) {
      if (!source.includes("isCronAuthorized")) {
        violations.push(`${rel}: cron must use isCronAuthorized`);
      }
      if (source.includes("return true;")) {
        violations.push(`${rel}: looks fail-open`);
      }
      continue;
    }
    const methods = exportedMethods(source);
    if (methods.length === 0) violations.push(`${rel}: no exported handlers`);
    if (!AUTH_PROOF.some((p) => source.includes(p))) {
      violations.push(`${rel}: no auth proof`);
    }
  }
  assert.deepEqual(violations, []);
});

test("session cookie is never set to a raw user id", () => {
  const violations = [];
  for (const file of routeFiles) {
    const source = readFileSync(file, "utf8");
    if (/set\(\s*['"]session['"]\s*,\s*user\.id/.test(source)) {
      violations.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(violations, []);
});

test("login endpoint keeps brute-force protection (phase 1.4)", () => {
  const loginRoute = readFileSync(path.join(API_DIR, "auth", "login", "route.ts"), "utf8");
  assert.ok(loginRoute.includes("checkLoginLimit"), "POST /api/auth/login must call checkLoginLimit");
  assert.match(
    loginRoute,
    /status:\s*429/,
    "login must return 429 when rate-limited"
  );
  assert.match(
    loginRoute,
    /Retry-After/,
    "login 429 must include Retry-After"
  );
});

test("public page GET responses filter unpublished content", () => {
  const pagesList = readFileSync(path.join(API_DIR, "pages", "route.ts"), "utf8");
  assert.ok(pagesList.includes("isPublished: true"), "GET /api/pages must filter drafts");

  const pagesById = readFileSync(path.join(API_DIR, "pages", "[id]", "route.ts"), "utf8");
  assert.ok(pagesById.includes("page.isPublished"), "GET /api/pages/[id] must check draft");
  assert.ok(pagesById.includes("getCurrentUser"), "GET /api/pages/[id] must know the caller");
});

test("Project is public by design: no draft/published flag (policy 2026-10-09)", () => {
  const schema = readFileSync(path.join(ROOT, "prisma", "schema.prisma"), "utf8");
  const model = schema.match(/model Project \{([\s\S]*?)\n\}/);
  assert.ok(model, "Project model must exist in prisma/schema.prisma");
  assert.ok(
    !/(isPublished|publishedAt|status|visibility)/i.test(model[1]),
    "THOTH is open source; every Project is intentionally public. The absence of a publish flag is policy decided by พี่ฆัง (2026-10-09), NOT a defect. Do not add draft filtering to Project as a 'fix' — changing this policy requires a new decision recorded in AGENTS.md and a deliberate update to this test."
  );
});

test("GET /api/projects is public by design and exposes exactly the declared public field set", () => {
  const APPROVED = [
    "id", "title", "description", "categoryId", "date", "thumbnail",
    "gallery", "videoLink", "projectUrl", "toolsUsed",
    "createdAt", "updatedAt", "category",
  ];

  const dataSrc = readFileSync(path.join(ROOT, "lib", "project-data.ts"), "utf8");
  const selectMatch = dataSrc.match(/PUBLIC_PROJECT_SELECT\s*=\s*\{([\s\S]*?)\}\s*satisfies/);
  assert.ok(selectMatch, "PUBLIC_PROJECT_SELECT must be declared in lib/project-data.ts");

  const keys = [...selectMatch[1].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]).sort();
  assert.deepEqual(
    keys,
    [...APPROVED].sort(),
    "even though all Projects are public by design, the whitelist stays as the disclosure boundary: public fields must match the approved list exactly (additions/removals must be deliberate, with AGENTS.md updated)"
  );

  const listRoute = readFileSync(path.join(API_DIR, "projects", "route.ts"), "utf8");
  assert.ok(listRoute.includes("getAllProjectsPublic"), "GET /api/projects must use the public projection");

  const byIdRoute = readFileSync(path.join(API_DIR, "projects", "[id]", "route.ts"), "utf8");
  assert.ok(byIdRoute.includes("getProjectByIdPublic"), "GET /api/projects/[id] must use the public projection");
});
