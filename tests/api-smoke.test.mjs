import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const SMOKE_ENABLED = process.env.THOTH_HTTP_SMOKE === "1";
const SKIP_REASON = SMOKE_ENABLED ? "" : "Set THOTH_HTTP_SMOKE=1 to run HTTP smoke test (requires build + server)";

if (SMOKE_ENABLED) {
  describe(`HTTP smoke (401 on unauthenticated writes) — ${SKIP_REASON}`, () => {
    let server;
    let baseUrl;

    before(async () => {
      const env = {
        ...process.env,
        SESSION_SECRET: "smoke-test-secret-32bytes-length!!",
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/thoth?schema=public",
        NODE_ENV: "production",
        PORT: "0",
      };

      server = spawn("npx", ["next", "start"], {
        cwd: process.cwd(),
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let port = null;
      server.stdout.on("data", (data) => {
        const msg = data.toString();
        const m = msg.match(new RegExp("- Local:\\s+http://localhost:(\\d+)"));
        if (m) port = m[1];
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Server didn't start in 30s")), 30000);
        const check = setInterval(() => {
          if (port) {
            clearTimeout(timeout);
            clearInterval(check);
            baseUrl = `http://localhost:${port}`;
            resolve();
          }
        }, 200);
      });

      await new Promise((r) => setTimeout(r, 1000));
    });

    after(async () => {
      if (server && !server.killed) {
        server.kill("SIGTERM");
        await once(server, "exit");
      }
    });

    async function request(method, path, body = null) {
      const url = `${baseUrl}${path}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: res.status, body: await res.json().catch(() => res.text()) };
    }

    test("GET /api/projects — public read (not 401)", async () => {
      const { status } = await request("GET", "/api/projects");
      assert.ok(status !== 401, `GET /api/projects should not be 401 (got ${status})`);
    });

    test("POST /api/projects — requires auth (401)", async () => {
      const { status } = await request("POST", "/api/projects", { title: "x", description: "y", categoryId: "z", date: new Date().toISOString() });
      assert.strictEqual(status, 401, `POST /api/projects should be 401 (got ${status})`);
    });

    test("PATCH /api/projects/any-id — requires auth (401)", async () => {
      const { status } = await request("PATCH", "/api/projects/00000000-0000-0000-0000-000000000000", { title: "updated" });
      assert.strictEqual(status, 401, `PATCH /api/projects/:id should be 401 (got ${status})`);
    });

    test("DELETE /api/projects/any-id — requires auth (401)", async () => {
      const { status } = await request("DELETE", "/api/projects/00000000-0000-0000-0000-000000000000");
      assert.strictEqual(status, 401, `DELETE /api/projects/:id should be 401 (got ${status})`);
    });

    test("POST /api/pages — requires auth (401)", async () => {
      const { status } = await request("POST", "/api/pages", { title: "x", slug: "y", content: "z" });
      assert.strictEqual(status, 401, `POST /api/pages should be 401 (got ${status})`);
    });

    test("POST /api/categories — requires auth (401)", async () => {
      const { status } = await request("POST", "/api/categories", { name: "test" });
      assert.strictEqual(status, 401, `POST /api/categories should be 401 (got ${status})`);
    });

    test("POST /api/staff — requires auth (401)", async () => {
      const { status } = await request("POST", "/api/staff", { name: "x", slug: "y", role: "z" });
      assert.strictEqual(status, 401, `POST /api/staff should be 401 (got ${status})`);
    });

    test("POST /api/admin/automation/cron — requires cron secret (401)", async () => {
      const { status } = await request("POST", "/api/admin/automation/cron", {});
      assert.strictEqual(status, 401, `POST /api/admin/automation/cron should be 401 (got ${status})`);
    });
  });
}