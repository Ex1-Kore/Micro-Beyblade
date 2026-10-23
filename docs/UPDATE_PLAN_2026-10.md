# แผนอัปเดต THOTH — ทุกภาคส่วน (เตรียมงาน)

> จัดทำ: **2026-10-08 โดย ฌอน (opencode)** จากการตรวจสอบโค้ดจริงทั้งโปรเจกต์
> สถานะเอกสาร (reconcile **2026-10-10** เทียบ `docs/FEATURE_MODULE_ROADMAP_2026-10.md` §0): **เฟส 1–7 เสร็จสมบูรณ์** (✅ 1.1–1.7 · ⚠️ 1.8 "ตรวจเมื่อเรียกใช้แล้ว; ยังไม่ตรวจตอน startup" — ไม่นับปิดครบตามเกณฑ์เดิม) · เฟส 2 (ทางเลือก) เสร็จแล้ว · เฟส 3–4 เสร็จ · เฟส 6.1–6.3/6.5 เสร็จ · เฟส 7 = มี repo แล้ว; **งานที่เหลือ = 1.8 startup fail-fast (deferred) · 6.4 E2E Playwright (deferred) · Core 8–9 (ยังไม่อนุมัติ)**
> แผน Core ระยะต่อไป (ความปลอดภัย/โครงสร้าง) อยู่ที่ `docs/FEATURE_MODULE_ROADMAP_2026-10.md` (เฟส 8–9) — **ยังไม่อนุมัติ implementation รายเฟส**
> อ้างอิงปัญหา: ดู `AGENTS.md` ข้อ 3 (P0–P3)
> ⚠️ กฎบังคับ: ห้ามเริ่มเฟสใดโดยไม่ได้รับอนุมัติ · ห้ามแก้ `.env.local` · ห้าม commit/push

---

## 0. Baseline (วัด 2026-10-08 · reconcile 2026-10-10)

| รายการ | ผลลัพธ์จริง |
| --- | --- |
| `npm ci` | ผ่าน (645 packages) — แต่ npm 12 block install-scripts → ต้องรัน `npx prisma generate` เอง |
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 |
| `npm run lint` | ✅ 0 errors / 20 warnings (reconcile 2026-10-10; เดิม 30 errors / 22 warnings) |
| git | ✅ repo (init 2026-10-09) — commit แรก `a6eeca1` · remote `origin` (GitHub — พี่ฆัง push เอง) + `gitea` (LAN) · **ไม่ push** |
| การทดสอบ | ✅ **151 tests** ผ่าน (`node --test tests/*.test.mjs` — 14 ไฟล์); วัด 2026-10-08 = ไม่มีเลย |
| API route files | 30 (`app/api/**/route.ts`) |
| หน้า public พัง | ✅ **แก้แล้ว** — ลบ `app/products/page.tsx`, `app/dashboard/page.tsx` + ปรับ `app/page.tsx` ให้ลิงก์เหลือของที่ทำงานจริง |

**เป้าหมายรวม:** ทำให้ lint ผ่าน, ปิดช่องโหว่ P0, ให้เอกสาร/โค้ด/DB ตรงกัน, มี test อย่างน้อย smoke, มี git repo + remote ตามที่พี่ฆังสั่ง

> **Baseline ที่เป็นทางการ (2026-10-10):** ดู `docs/FEATURE_MODULE_ROADMAP_2026-10.md` §0 — ลำดับงาน Core = baseline → XSS → migration strategy → Webhooks → RBAC → Revision (ต้องทวนขอบเขตและรออนุมัติเป็นรายเฟส)

---

## เฟส 1 — P0 ความปลอดภัย (ทำก่อนสิ่งอื่น)

| # | งาน | ไฟล์ที่กระทบ | เสร็จเมื่อ / สถานะ |
| --- | --- | --- | --- |
| 1.1 | สร้าง guard ส่วนกลาง `requireApiAuth()` (ตรวจ session cookie + ลายเซ็น + expiry) แล้วครอบทุก route ที่มี `POST/PATCH/DELETE` | `lib/auth.ts` + ทุก `app/api/**/route.ts` (≈20 ไฟล์) | ✅ 2026-10-09 — `guardApiSession` ใน 21 route files + `tests/route-policy.test.mjs` บังคับทุก write (acceptance: POST ไม่มี cookie → 401) |
| 1.2 | ขยาย `proxy.ts` matcher ให้ครอบ `/api/*` ด้วย (หรือย้ายการตรวจไปฝั่ง handler ล้วน — เลือกทางเดียวให้ชัด) | `proxy.ts` | ✅ 2026-10-09 — ทั้งคู่: proxy matcher มี `/api/:path*` + handler-level guard |
| 1.3 | เปลี่ยน session จาก `user.id` เปล่า → token ที่เซ็นด้วย `SESSION_SECRET` (HMAC หรือ JWT) + ตรวจ expiry ฝั่ง server | `lib/auth.ts`, `proxy.ts` | ✅ 2026-10-09 — `signSessionToken` (ขาด `SESSION_SECRET` → throw) |
| 1.4 | เพิ่ม rate limit + lockout ที่ `POST /api/auth/login` (ตอนนี้ brute-force ได้ไม่จำกัด) | `app/api/auth/login/route.ts` + `lib/security/login-limit.ts` | ✅ 2026-10-10 — buckets 2 ชั้น (ต่อ IP + ต่อ account) บน `lib/security/rate-limit.ts` · env `LOGIN_RATE_LIMIT_MAX`/`WINDOW_MS` + `LOGIN_ACCOUNT_LIMIT_MAX`/`WINDOW_MS` (0 = ปิด, default 10/15min IP + 5/15min account) · 429 + `Retry-After` ก่อน verify · success reset bucket account · tests `login-limit.test.mjs` + route-policy guard |
| 1.5 | `POST /api/upload`: ต้อง auth + จำกัดจำนวน/ความถี่ + **ตรวจชนิดไฟล์จากเนื้อหาจริง** (ไม่เชื่อ MIME ที่ client ส่ง) | `app/api/upload/route.ts`, `app/api/admin/media/route.ts`, `lib/security/upload-guard.ts` | ✅ 2026-10-10 ตามมติพี่ (ตัด scope): auth ✅ + rate limit ✅ (2026-10-09) + **content-sniff จาก magic bytes** (JPEG `FFD8FF` / PNG / WebP `RIFF…WEBP` / GIF `GIF8`) — ต้องตรงกับ `file.type` ที่ client แจ้ง ไม่ตรง → 400 `File content does not match its declared type` (`lib/security/upload-guard.ts`, ใช้ทั้ง `/api/upload` + `/api/admin/media`) · **ตัด `image/svg+xml` ออกจาก allowlist แล้ว** (จนกว่าจะมี SVG sanitizer ที่เชื่อถือได้) · tests `tests/upload-guard.test.mjs` ×10 · **"ตรวจ content ซ้ำ (dedup)" ย้ายเป็นงาน P2/ปรับปรุง storage** — ทำเมื่อมีเหตุผลด้านพื้นที่/ค่าใช้จ่าย โดยต้องกำหนดวิธีนับซ้ำและผลเมื่อพบไฟล์ซ้ำให้ชัดก่อน (มติพี่ 2026-10-10) |
| 1.6 | `AUTOMATION_CRON_SECRET`: บังคับตั้งค่า (ถ้าว่าง → ปฏิเสธทุก request) + เพิ่มลง `.env.example` | `app/api/admin/automation/cron/route.ts`, `.env.example` | ✅ 2026-10-09 — `isCronAuthorized` fail-closed + key อยู่ใน `.env.example` แล้ว |
| 1.7 | Sanitize HTML ก่อน render (`dangerouslySetInnerHTML` ใน `app/[slug]/page.tsx`) – ใช้ sanitizer ฝั่ง server ตอนบันทึก หรือตอน render | `app/[slug]/page.tsx` + จุดอื่นที่เจอ | ✅ 2026-10-10 — สำเร็จผ่าน **Core เฟส 8.1** (sanitize-html allowlist + `normalizeUrl`) ใช้ตอนบันทึก (`app/api/pages` ×2) + ตอน render ทั้ง 2 ทาง (`app/[slug]` + `apps/web/[slug]`); tests `tests/xss-sanitization.test.mjs` ×5; dep ประกาศทั้ง root + `apps/web`; bug เก่า `cbe6635` (apps/web แทรก sanitizer ไม่ import – root tsconfig exclude `apps` → build พังเงียบ) แก้แล้ว |
| 1.8 | เพิ่ม `APP_ENCRYPTION_KEY` ลง `.env.example` + **ตรวจเมื่อเรียกใช้** ว่ามีค่า (ตอนนี้ automation บันทึก key จะ throw) | `.env.example`, `lib/security/secrets.ts` | ⚠️ ตามมติพี่ 2026-10-10: **"ตรวจเมื่อเรียกใช้แล้ว; ยังไม่ตรวจตอน startup"** — env อยู่ใน `.env.example` ✅ + `getKey()` throw เมื่อเรียก `encrypt/decryptSecret` แต่ไม่มี key ✅ (2026-10-09) + error ที่ throw ถูกส่งให้ผู้ใช้เห็นผ่าน `{ error: message }` ของ automation routes (บอกวิธีแก้: ต้องตั้ง `APP_ENCRYPTION_KEY`) · **ยังไม่ทำ startup fail-fast** — key จำเป็นเฉพาะฟีเจอร์ secret (SecretStore/automation) ไม่ใช่ทั้งแอป จึงปล่อยให้แอปวิ่ง แต่ฟีเจอร์ secret ปฏิเสธชัดเจน; fail-fast ตอน startup จะค่อยพิจารณาเมื่อ SecretStore ถูกกำหนดเป็น feature บังคับของทุก deployment + ตั้ง key ครบทุก environment แล้ว · ✅ **เพิ่ม non-fatal readiness check (2026-10-10):** `lib/system/secret-readiness.ts` → `getSecretFeatureStatus()` (อ่าน env ล้วน **ไม่ throw**) เปิดผ่าน `GET /api/system/bootstrap` เป็น `features.secrets` + แสดงการ์ด "Secret storage (APP_ENCRYPTION_KEY)" และคำแนะนำวิธีแก้บน `/admin/database` — แอปยังวิ่งปกติ ไม่ทำ fail-fast; tests `tests/secret-readiness.test.mjs` ×4 · **ยังไม่นับปิดครบตามเกณฑ์ startup-check เดิม** |

**อนุมัติเฉพาะเฟส 1 ก่อน** แล้วค่อยไปเฟส 2 — เพราะ 1.1–1.3 เปลี่ยนพฤติกรรม auth ทั้งระบบ

---

## เฟส 2 — ฟีเจอร์ / พื้นผิวที่เสีย

| # | งาน | ทางเลือกที่เลือก | สถานะ |
| --- | --- | --- | --- |
| 2.1 | `/products` + `/dashboard` พัง (เรียก API ที่ไม่มี) | **(ข)** ลบหน้า `app/products`, `app/dashboard` + ปรับ `app/page.tsx` (ลบลิงก์/เนื้อหา Products/Dashboard) + ตัดคำโปรโมท Products ออกจาก CHANGELOG/RELEASE_NOTES | ✅ เสร็จ — home page ลิงก์เหลือ Marketplace/Documentation/Admin Login, hero buttons = Browse Marketplace / Admin Sign In |
| 2.2 | `frontend/` เป็น dead code 1,877 LOC | **(ก)** ลบ `frontend/` ทั้งโฟลเดอร์ (git rm -r) — ไม่มี import ใดอ้างถึง | ✅ เสร็จ — 11 ไฟล์หายไป |
| 2.3 | `modules/` มีแค่ `staff-member` แต่ README อ้าง `projects/products/staff/pages` | README แล้วตรงจริง (บรรทัด 118: "module เดียวที่ wired แล้ว") + MODULE_STANDARD เป็นมาตรฐานทั่วไป — **ไม่ต้องแก้เพิ่ม** | ✅ เสร็จ |
| 2.4 | `extensions/` ยังไม่มี extension จริง | ✅ มีตัวอย่างแล้ว `extensions/hello-module/` (commit `a67193e`, 2026-10-10) | ✅ เสร็จ |
| 2.5 | Rich-text editor เป็น contentEditable เขียนเอง (262 บรรทัด) — ไม่มี sanitization | จัดการผ่าน Core เฟส 8.2 (Tiptap + JSON block doc + sanitize) — **ไม่ใช่งานเฟส 2** | ✅ ส่งต่อ Core 8.2 |

---

## เฟส 3 — Config / Dependency / Deploy

| # | งาน | หมายเหตุ / สถานะ |
| --- | --- | --- |
| 3.1 | แก้ชื่อ S3 env ให้ตรงกัน: `.env.example` `AWS_S3_*` ↔ โค้ด `S3_*` | ✅ 2026-10-10 — `.env.example` ใช้ `S3_*` + `STORAGE_DRIVER`/`LOCAL_UPLOAD_URL_BASE` แล้ว |
| 3.2 | ตัด dependency ที่ไม่ใช้ 6 ตัว: `admin-lte`, `bootstrap`, `jquery`, `popper.js`, `@uiw/react-markdown-preview`, `@uiw/react-md-editor` | ✅ 2026-10-10 — `npm uninstall` แล้ว, `npm ci` + `build` ผ่าน |
| 3.3 | ลบ env ที่โค้ดไม่ใช้ (`SMTP_*`, `GITHUB_API_TOKEN`, `LOG_LEVEL`, `SKIP_ENV_VALIDATION`, `SESSION_SECRET` → พอ 1.3 ทำแล้วจะถูกใช้จริง) | ✅ 2026-10-10 ฝั่ง `.env.example` · ⚠️ `.env.local` ยังมีขยะค้าง — รอพี่ฆังสั่ง cleanup |
| 3.4 | แก้ `vercel.json`: เอา `env`, `nodeVersion`, `buildEnvironment` ออก (ไม่อยู่ใน schema ปัจจุบันของ Vercel) | ✅ เสร็จแล้ว — `vercel.json` สะอาดอยู่แล้ว (ไม่มี key 3 ตัวนี้) |
| 3.5 | เพิ่ม `"engines": { "node": ">=20" }` ใน `package.json` + ปรับ README ให้ Node 20+ ตรงกัน | ✅ 2026-10-10 — package.json มี engines, README อัปเดตแล้ว |
| 3.6 | `Dockerfile`: เพิ่ม `frontend/` ถ้า 2.2 เลือก "เก็บ" และพิจารณาไม่ COPY source ทั้งหมดใน runner stage | ✅ N/A — 2.2 ลบ `frontend/` แล้ว; runner stage ไม่ COPY frontend |
| 3.7 | `docker-compose.yml` `POSTGRES_PASSWORD` → ต้องไม่ default ใน production | ✅ 2026-10-10 — เปลี่ยนเป็น `${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}` ทั้ง db และ cms service; เพิ่ม `POSTGRES_PASSWORD=""` ใน `.env.example` |
| 3.8 | ปรับ CI `.github/workflows/release.yml`: เอา `continue-on-error: true` ออกจาก lint หลัง lint ผ่านแล้ว | ✅ 2026-10-10 — ลบ `continue-on-error: true` แล้ว (lint = 0 errors) |

---

## เฟส 4 — ข้อมูล/Database

| # | งาน | สถานะ |
| --- | --- | --- |
| 4.1 | regenerate `PRODUCT_CMS_SETUP.sql` ให้ตรง `prisma/schema.prisma` | ✅ 2026-10-10 — `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` → เขียนทั้ง `prisma/migrations/20261010120000_init/migration.sql` + `PRODUCT_CMS_SETUP.sql` (12 ตาราง, indexes, FKs ครบ) |
| 4.2 | ตัดสินใจเรื่อง migrations | ✅ **ตัดสินใจ: ใช้ `prisma migrate`** — สร้าง baseline migration `20261010120000_init` + `migration_lock.toml`; Dockerfile CMD เปลี่ยนเป็น `npx prisma migrate deploy`; DB ที่ provisioned แล้วต้องรันครั้งเดียว `npx prisma migrate resolve --applied 20261010120000_init` ก่อน deploy ครั้งต่อไป |
| 4.3 | ตรวจ `data/projects.json` + `lib/seed-menu.ts` ว่ายังตรงกับ schema | ✅ เสร็จ — `data/projects.json` = `[]` (valid); `lib/seed-menu.ts` fields ทั้งหมดตรง `MenuItem` model |

---

## เฟส 5 — เอกสาร (ลดจาก 23 ไฟล์)

| # | งาน | สถานะ |
| --- | --- | --- |
| 5.1 | ✅ ทำแล้ว (2026-10-09): README เขียนใหม่ตามโค้ดจริง — ลบรายการที่ไม่มีจริง (`/api/products`, `tailwind.config.js`, `lib/api.ts` ฯลฯ) | ✅ |
| 5.2 | ✅ ทำแล้ว (2026-10-09): ลบเอกสารซ้ำ/หมดอายุ 16 ไฟล์ (QA_×4, TESTING_EXECUTION_PLAN, QA_ACTION_PLAN, COMPLETION_SUMMARY, FINAL_STATUS, PRODUCTION_CHECKLIST, RELEASE_CHECKLIST, BETA_RELEASE_COMMANDS, SUPPORT_PROCESS, GIT_COMMANDS.txt, BUG_TRACKING, STRUCTURE.md) → เหลือ root .md 11 ไฟล์ (สำรองไว้ที่ `/tmp/opencode/thoth-trash-2026-10-09/`) | ✅ |
| 5.3 | ✅ ทำแล้ว (2026-10-09): ลบ `desktop.ini`, `README.html` | ✅ |
| 5.4 | ✅ แทนที่ด้วย README.md ใหม่ (โครงสร้างแยกส่วน CMS/web + flow chart) — ไม่ใช้ `STRUCTURE.md` แล้ว (ลบไปกับ 5.2) | ✅ |

---

## เฟส 6 — Quality / Test (6.1 ทำแล้ว)

| # | งาน | สถานะ |
| --- | --- | --- |
| 6.1 | ✅ ทำแล้ว: ใช้ `node --test` + script `test` — **151 tests ผ่าน** (14 ไฟล์: `automation-helpers`, `block-document`, `block-renderer`, `cors-policy`, `cron-auth`, `extension-url-guard`, `login-limit`, `page-input`, `rate-limit`, `route-policy`, `secret-readiness`, `secrets-crypto`, `session`, `template-policy`, `upload-guard`, `xss-sanitization`) | ✅ |
| 6.2 | Unit: `lib/security/secrets` (`tests/secrets-crypto.test.mjs`), `lib/automation/helpers` (`tests/automation-helpers.test.mjs`) | ✅ เพิ่มแล้ว |
| 6.3 | Integration/API smoke: HTTP 401 assert บน write endpoints — `tests/api-smoke.test.mjs` (skip unless `THOTH_HTTP_SMOKE=1`) | ✅ เพิ่มแล้ว (opt-in) |
| 6.4 | E2E smoke (Playwright): `/` → `/login` → `/admin` → สร้าง Page → ดูหน้า public | ⏸️ **Deferred** — ต้องติดตั้ง Playwright + browser + dev server; ยังไม่ทำ |
| 6.5 | ทำ `npm run lint` ให้เป็น 0 error แล้วค่อยเปิด gate ใน CI | ✅ lint = 0 errors (20 warnings); CI gate เปิดแล้ว (เฟส 3.8) |

---

## เฟส 7 — Git / Release (ต้องสั่งก่อนเสมอ)

1. ✅ **มี repo แล้ว** — init + commit แรก `a6eeca1` (2026-10-09) · remote `origin` (GitHub) + `gitea` (LAN) · บันทึกลงดิสแล้ว (ไม่ต้อง push)
2. ✅ ตรวจ `.gitignore` แล้ว — `.env.local` ไม่หลุด (commit แรก verify แล้ว)
3. ✅ ปรับ `CHANGELOG.md` (entry `2.0.0-beta.1`) / `RELEASE_NOTES.md` (bump เป็น v2) แล้ว 2026-10-09 — **อัปเดตเพิ่ม 2026-10-10: ตัดคำโปรโมท Products ออก**
4. ✅ version ปัจจุบัน: **`2.0.0-beta.1`** (bump แล้ว 2026-10-09 ตามคำสั่ง — ข้าม beta.2)

---

## ลำดับที่แนะนำ (ถ้าอนุมัติทั้งหมด)

```
เฟส 1 (P0 ความปลอดภัย)  →  เฟส 2 (ฟีเจอร์ที่เสีย)  →  เฟส 4 (DB ตรงกัน)
      ↓                                              ↓
เฟส 3 (config/deps)   ←  ระหว่างทางรัน tsc/build/lint ทุกครั้ง
      ↓
เฟส 5 (เอกสาร)  →  เฟส 6 (test + lint 0 error)  →  เฟส 7 (git/release รอสั่ง)
```

---

## กติกางาน

- แก้จุดไหน → รัน `npx tsc --noEmit` + `npm run build` + `npm run lint` ทันที
- ทุกอย่างต้องพิสูจน์บนดิสก์ (Write → Verify → Report)
- ห้ามเดาค่า/ห้ามโชว์ secret/ห้ามแก้ `.env.local`/ห้าม commit โดยไม่สั่ง
- งานไหนกระทบหลายไฟล์ → ทวนขอบเขตแล้วรอบอนุมัติก่อนเสมอ