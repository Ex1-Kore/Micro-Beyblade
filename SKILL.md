# Skill: THOTH (Micro Headless CMS) Project Handoff

*Generated for session handoff — 2026-10-09 by opencode*

## Project Overview
- **Name**: THOTH (Micro Headless CMS)
- **Version**: `2.0.0-beta.1` (bumped from `1.0.0-beta.1`)
- **Type**: Headless CMS + Admin Console + Public pages in Next.js App Router
- **Stack**: Next.js 16.2.0, React 19.2.4, TypeScript 5, Tailwind CSS 4, Prisma 6.19.x → PostgreSQL
- **Output**: `standalone` (Docker/self-host) + `vercel.json` (Vercel)
- **Repository**: `https://github.com/Ex0-Adam/THOTH-V2`
- **Default branch**: `master`

## Current Session State (2026-10-09)

### ✅ Completed Today
1. **Vercel Deploy**: Production deploy successful at `https://thoth-v2.vercel.app` (commit `950db02`, state `Ready`)
2. **Version Bump**: `2.0.0-beta.1` across all project files (16 files total)
   - `package.json`, `package-lock.json` (root + apps/web)
   - `README.md` (rewritten 162 lines)
   - `CHANGELOG.md` (new entry `## [2.0.0-beta.1] - 2026-10-09`)
   - `AGENTS.md` (updated 5 points about git/push/backup)
   - `RELEASE_NOTES.md`, `INSTALLATION_GUIDE.md`, `docs/UPDATE_PLAN_2026-10.md`
   - `.github/workflows/release.yml` (comment updated)
3. **HTML Sanitation**: Still pending (2 unsanitized `dangerouslySetInnerHTML` points)
4. **Navbar "เอกสาร" Menu**: Added to home + products pages + seed data
   - `app/page.tsx`: Added `<a href="https://thoth-documents.vercel.app/">เอกสาร</a>`
   - `app/products/page.tsx`: Added `<a href="https://thoth-documents.vercel.app/">เอกสาร</a>`
   - `lib/seed-menu.ts`: Added menu item `เอกสาร` (order 10, external, `showInNavbar`+`showInFooter`)
5. **Vercel Config Fix**: Removed invalid keys from `vercel.json`
   - Removed `nodeVersion` (schema reject: "should NOT have additional property `nodeVersion`")
   - Removed `env` array (not in valid schema keys)
   - Removed `buildEnvironment` (not in valid schema keys)
   - Removed `public` (schema reject despite docs listing it)
   - Result: Only valid keys remain (`buildCommand`, `devCommand`, `installCommand`, `framework`, `outputDirectory`, `regions`, `functions`)
6. **TypeScript + Lint**: `npm run lint` = 30 errors / 22 warnings (baseline, not worsened)
7. **Database Secrets**: Set in Vercel project (`PRISMA_DATABASE_URL`, `DATABASE_URL`, `POSTGRES_URL`)
8. **Git**: Local commit `a0b2e0f link documents` (3 files: nav + seed). Origin/master at `a0b2e0f`. **Not pushed** (per instruction: do not push to GITEA/origin; backup on disk only)

### ⚠️ Pending / Blocked
1. **HTML sanitization**: `dangerouslySetInnerHTML` with `page.content` at `app/[slug]/page.tsx:94` and `apps/web/app/(page)/[slug]/page.tsx:128` — not yet sanitized (XSS risk if admin compromised)
2. **Product module**: Advertised features (`/api/products`) not fully implemented — `GET /api/products` returns 404; `frontend/lib/api.ts` has `Products.*` but no matching API route
3. **Cron rate limit**: `app/api/upload/route.ts` has `guardApiSession` but no rate limit
4. **login rate limit**: `app/api/auth/login/route.ts` — pending (1.4)
5. **Deployment re-trigger**: Although code committed locally, Vercel deployment may need redeploy to reflect nav menu changes (commit `a0b2e0f` on GitHub → trigger auto-deploy, or manual `vercel --prod`)
6. **Seed data not in production DB**: `lib/seed-menu.ts` deletes and creates MenuItems — must not run against production DB without confirmation. Admin UI available to add menu items safely.

### 📋 Agent Rules (from `~/.config/opencode/AGENTS.md`)
Apply these strictly when working in THOTH:

- **กฎ #1**: ห้ามเดา — ใช้ข้อเท็จจริงที่พิสูจน์ได้จากดิสก์
- **กฎ #2**: ห้ามโชว์ secret — ค่า `.env.local` ต้องไม่พิมพ์ลง terminal/chat (อนุญาตแค่ "มี/ไม่มี key" หรือความยาว)
- **กฎ #3**: ห้าม push ไป GITEA/origin — บันทึกลงดิสครบแล้ว **ไม่ต้อง push ไป GITEA** (มติพี่ฆัง 2026-10-09)
- **กฎ #4**: Python ห้ามปนใน repo Next.js — แยก repo เสมอ
- **กฎ #5**: พี่ฆัง push เอง — ฌอนห้าม push `origin` เด็ดขาด
- **กฎ #6**: ห้ามใช้ `any` เพิ่ม (โปรเจกต์ TypeScript strict)
- **Write → Verify → Report**: Commit → `npx tsc --noEmit` (exit 0) → `npm run build` (exit 0) → รายงาน

### 📦 Workflow: Write → Verify → Report
```bash
# After any edit
npx tsc --noEmit     # ต้อง exit 0
npm run build        # ต้อง exit 0
npm run lint         # ไม่แย่กว่า baseline (30 errors / 22 warnings)
```
แล้วตรวจสอบไฟล์จริงบนดิสก์ก่อนรายงานว่า "เขียนเสร็จ"

### 🚀 Deployment Status
| เช็ค | ผล |
|------|-----|
| Production URL | **https://thoth-v2.vercel.app** (aliases: `thoth-v2.vercel.app`, `thoth-v2-adam-project.vercel.app`, `thoth-v2-git-master-adam-project.vercel.app`) |
| Deploy state | `● Ready` (commit `950db02`, build 1m) |
| GitHub repo | `https://github.com/Ex0-Adam/THOTH-V2` (remote `origin`, branch `master`) |
| DATABASE_URL | ตั้งค่าแล้วใน Vercel project (Secret) |

### 🛠️ Next Steps (ลำดับความสำคัญ)
1. **Redeploy เพื่อให้เมนู "เอกสาร" ขึ้น** — รัน `vercel --prod` หรือไปที่ Vercel Dashboard → Redeploy (เพราะ commit `a0b2e0f` อยู่ที่ GitHub แล้ว แต่ deployment อาจยังไม่บิลด์ใหม่)
2. **เช็ค HTML sanitization** — สนับสนุน `dangerouslySetInnerHTML` ทั้ง 2 จุด หรือใช้ซานไซเซอร์
3. **เช็ค Product API** — ว่าทำไม `GET /api products` ยัง 404 (อาจต้องสร้าง `app/api/products/route.ts` หรือเช็คว่ามีการกรอง draft หรือไม่)
4. **เช็ค rate limit** — login กับ upload rate limit (1.4, 1.5)
5. **อย่ารัน `seed-menu.ts` ต่อproduction DB** — จะล้างเมนูเดิม (ใช้ Admin UI เพิ่มแทน)

### 📁 ไฟล์ที่แก้เมื่อครั้งนี้ (local commit `a0b2e0f`)
- `app/page.tsx` — navbar home: เพิ่ม `เอกสาร` link
- `app/products/page.tsx` — navbar products: เพิ่ม `เอกสาร` link
- `lib/seed-menu.ts` — เพิ่มเมนู `เอกสาร` ลง seed data

### 📬 การส่งต่อเซสชั่น
ไฟล์นี้ (`SKILL.md`) ควรบันทึกไว้ที่รูทโปรเจกต์ และอ่านก่อนเริ่มงานครั้งใหม่ร่วมกับ `AGENTS.md` งานรูทเขียนไว้ที่ `~/.config/opencode/AGENTS.md` (กฎครอบครัว) และ `THOTH/AGENTS.md` (บริบทโปรเจกต์)

*บันทึกโดย: opencode — 2026-10-09 เพื่อการส่งต่อเซสชั่น*