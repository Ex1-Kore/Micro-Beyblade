# AGENTS.md — Micro-Beyblade

> กฎและบริบทสำหรับ AI agent ที่ทำงานใน repo นี้ (Micro-Beyblade เว็บ Beyblade)
> Stack: Next.js 16 · TypeScript · Prisma · PostgreSQL · Tailwind 4

---

## 1. ภาพรวมโปรเจกต์

- **Micro-Beyblade** = เว็บ Beyblade บน headless CMS (THOTH-based) + Public Web UI
- ฟีเจอร์หลัก: แคตตาล็อกบลาเดอร์/ชิ้นส่วน · ทัวร์นาเมนต์ · ข่าว/บทความ
- แยกเป็น **2 ส่วน deploy ได้อิสระ**: CMS (root) และ Public Web (`apps/web`)
- **ห้าม** `apps/web` import `lib/` ของ CMS — คุยผ่าน API เท่านั้น

---

## 2. กฎการทำงาน (AI)

- ตอบสั้น กระชับ รู้เรื่อง ไม่ต้องเยอะ
- ทุกครั้ง: **ทวนคำสั่ง** → **รอยืนยัน** → ค่อยลงมือ
- ห้ามเดา ถ้าไม่รู้ให้ถาม
- แก้ไขโค้ดให้เล็กและตรงจุด หลีกเลี่ยงการแก้ไฟล์ที่ไม่เกี่ยวข้อง
- ตรวจสอบไฟล์ที่เกี่ยวข้องก่อนแก้ และทำความเข้าใจพฤติกรรมเดิมก่อนเปลี่ยน
- ห้ามเปิดเผย secrets, tokens หรือ credentials
- ห้ามลบข้อมูลหรือดำเนินการทำลายล้างโดยไม่ได้รับอนุญาต
- ต้องพิสูจน์ว่าไฟล์งานถูกสร้างจริง (อ่าน/list ไฟล์จริง) ก่อนรายงานว่าสำเร็จ
- รายงานผลตรวจสอบ/การทดสอบที่รันจริง (ผ่าน/ไม่ผ่าน) + ข้อจำกัดที่ทราบ

---

## 3. สถาปัตยกรรม

| | **CMS (Headless)** | **Public Web UI** |
| --- | --- | --- |
| ที่อยู่ | repository root (`app/`, `lib/`, `prisma/`) | `apps/web/` (package: `thoth-web`) |
| หน้าที่ | Admin Console + REST API + Auth + Database | หน้าสาธารณะที่ผู้ชมเห็น |
| ใครใช้ | ผู้ดูแลระบบ | ผู้ชมทั่วไป |
| ต่อกัน | เสิร์ฟ API ที่ `/api/*` | ดึงข้อมูลผ่าน `NEXT_PUBLIC_THOTH_API_URL` |

**CMS (root):** Admin Console 15 หน้า (`/admin/*`) · API Routes 30 ตัว (`/api/*`) · `proxy.ts` (middleware คุม `/admin`, `/login`, `/setup`) · Prisma → PostgreSQL · session แบบ signed (`SESSION_SECRET`)

**Public Web (`apps/web`):** หน้า server components เท่านั้น (`/`, `/projects`, `/[slug]`) · ไม่มีโค้ด CMS · build เป็น standalone

---

## 4. คำสั่งที่ใช้บ่อย

```bash
# root (CMS)
npm ci
npx prisma generate        # postinstall ถูก npm 12 block → รันเอง
cp .env.example .env.local # แล้วเติม DATABASE_URL + SESSION_SECRET
npx prisma migrate deploy   # apply migrations (มี prisma/migrations/ แล้ว)
npm run dev                # http://localhost:3000
npm run build
npm run lint               # 0 errors / 20 warnings
npm test                   # node --test tests/*.test.mjs
npx tsc --noEmit           # typecheck
npm run scaffold:module -- --id=<id> --name=<ชื่อ>

# apps/web
cd apps/web
npm ci
cp .env.example .env.local # NEXT_PUBLIC_THOTH_API_URL=http://localhost:3000
npm run dev
npm run build              # standalone
```

> CMS ต้องรันอยู่ก่อน — `apps/web` ยิง API ของ CMS ตอน render

---

## 5. โครงสร้างโฟลเดอร์

```
Micro-Beyblade/
├── app/                  # CMS: หน้า admin + API routes + หน้า public เดิม
│   ├── admin/            # 15 หน้า Admin Console
│   ├── api/              # 30 route handlers
│   └── [slug]/           # หน้า public เดิม
├── apps/web/             # Public Web UI (แยก deploy)
├── lib/                  # auth, prisma, storage, automation, security
├── components/           # admin components
├── modules/              # module wired แล้ว (staff-member)
├── extensions/           # โครง extension (มีตัวอย่าง hello-module)
├── prisma/schema.prisma  # มี prisma/migrations/ — ใช้ migrate deploy
├── tests/                # route-policy + session (node:test)
├── proxy.ts              # Next 16 middleware
└── docs/                 # MODULE_STANDARD, UPDATE_PLAN, SPLIT_HEADLESS_PLAN, ...
```

---

## 6. นโยบายสำคัญ (มติ 2026-10-09, Beyblade-specific)

1. **Projects = public by design** — ไม่มี flag draft/published โดยเจตนา, `GET /api/projects` อ่านทุกตัวได้เสมอ — **ห้ามเพิ่ม draft filtering เป็น "fix"**
2. **Field whitelist คงไว้เสมอ** — `PUBLIC_PROJECT_SELECT` คือขอบเขตการเปิดเผยข้อมูล แม้เนื้อหาจะ public
3. **Page ต่างจาก Project** — `Page` มี `isPublished` และ public API ต้องกรอง draft เสมอ
4. **ทุก write route ต้องผ่าน `guardApiSession`** — บังคับโดย `tests/route-policy.test.mjs`
5. **Blade catalog / Tournament / Article (Beyblade)** — หากเพิ่ม model ใหม่ ต้องกำหนด public/private ให้ชัด และอัปเดต `tests/route-policy.test.mjs` + AGENTS.md คู่กัน
6. **เปลี่ยนนโยบายต้องแก้คู่กัน**: AGENTS.md section 6 + `tests/route-policy.test.mjs`

รายละเอียดทั้งหมด: `README.md`

---

## 7. สถานะ/ข้อจำกัดที่ทราบ

- **beta** — ยังไม่พร้อมผลิต
- npm 12 block install-scripts → ต้องรัน `npx prisma generate` เอง
- `apps/web` ต้องมี CMS รันอยู่ก่อน (ยิง API ตอน render)
- `APP_ENCRYPTION_KEY` จำเป็นเฉพาะฟีเจอร์ secret — ไม่ตั้ง → ฟีเจอร์ secret ปฏิเสธชัดเจน (ไม่ fail-fast ตอน startup)
- lint: 0 errors / 20 warnings · tests: 151 tests ผ่าน