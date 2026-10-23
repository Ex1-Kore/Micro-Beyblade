# แผนแยก THOTH CMS และ Public Web

> ปรับแผน: **2026-10-08 โดย ธาร (Copilot)**  
> สถานะ: **ดำเนินการถึงขั้น C แล้ว (ตรวจ 2026-10-09 · ยืนยันซ้ำ 2026-10-10) — ขั้น 0/A/B/C เสร็จและผ่านเกณฑ์, ขั้น D/E ยังไม่เริ่ม**  
> ยืนยัน 2026-10-10: `apps/web/` มีจริง (`(site)/{home,products,projects}` + `(page)/[slug]`) แต่ยัง **ไม่ cutover** หน้า public ที่ root (`app/{page,products,dashboard,[slug]}` ยังอยู่ครบ); `apps/web/` ไม่มี `.git` ของตัวเองและถูก track โดย root repo (ยัง monorepo)  
> มติ: คง CMS/Admin/API ที่ repository root และแยก public web เป็นแอป deployable อิสระใน `apps/web/`; พิจารณาแยก repository ภายหลัง  
> แผนนี้แทนแนวทางเดิมที่เสนอแค่ route groups หรือแยก API กับ Admin UI ออกจากกัน

## 1. สภาพปัจจุบันที่ตรวจพบ

- โครงการเป็น Next.js App Router แอปเดียว: มีหน้า public, Admin UI, API, Prisma และ service logic อยู่ใน repository เดียวกัน
- `lib/` มี Prisma connection และ service/data modules; แต่ `app/admin/page.tsx` ยัง query Prisma โดยตรง
- API มี 30 route files (`app/api/**/route.ts`); public/admin read กับ write operations ยังไม่ได้แยก security policy อย่างครบถ้วน
- Client UI มีการเรียก API ด้วย relative URL `/api/...`; public web ที่แยก origin จึงต้องมี API base URL กลาง
- Server-rendered public slug page ใช้ service/Prisma โดยตรง จึงต้องเปลี่ยนเป็นเรียก public API หลังย้ายไป `apps/web/`
- พบ relative imports เข้า `lib/` จาก API 3 จุด; เปลี่ยนเป็น alias เป็นส่วนของการจัดเส้นเขต
- `next.config.ts` มี self-referencing rewrites เช่น `/api/:path*` ไป `/api/:path*` ซึ่งไม่ใช่การเชื่อมต่อข้ามแอป
- ปัจจุบันยังไม่มี Product model และไม่มี `/api/products`; หน้า Products และ Dashboard อ้าง endpoint ที่ไม่มีอยู่
- `frontend/` เดิมเป็น dead code ไม่ใช่แอปที่ย้ายไปใช้ได้ทันที และไม่อยู่ในขอบเขตให้ลบโดยอัตโนมัติ

## 2. สถาปัตยกรรมเป้าหมาย

```text
THOTH repository
├── app/                 CMS app ที่ root: Admin UI, API, login/setup
├── lib/                 domain services, auth, storage, automation, Prisma access
├── prisma/              schema และ database tooling — CMS เป็นเจ้าของ
└── apps/
    └── web/             public Next.js app แยก build/deploy
                         เรียก CMS ผ่าน public HTTP API เท่านั้น
```

### CMS app (repository root)

- คง Admin UI, authentication, API, `lib/`, Prisma schema และ database credentials ไว้ด้วยกัน
- Admin UI เรียก API บน origin เดียวกับ CMS; session cookie ไม่ต้องข้าม origin
- เป็นผู้ควบคุมการเขียน/แก้ไข/เผยแพร่เนื้อหาและเป็นเจ้าของฐานข้อมูล

### Public web app (`apps/web/`)

- มีเฉพาะ UI สำหรับผู้ชม เช่นหน้า home และหน้าเนื้อหาที่เลือกย้าย
- มี `package.json`, lockfile, Next config, TypeScript config, styles และ deployment entry ของตัวเอง
- ห้าม import source จาก `app/`, `lib/` หรือ `prisma/` ของ CMS และห้ามเชื่อมฐานข้อมูลโดยตรง
- เรียก CMS ผ่าน API client กลางที่ใช้ `NEXT_PUBLIC_THOTH_API_URL`; รองรับทั้ง client fetch และ server-side fetch
- ไม่ส่ง admin session cookie และไม่เก็บ secret ของ CMS ใน `NEXT_PUBLIC_*`

สองแอปต้องติดตั้ง dependency, build, start, deploy และ rollback แยกกันได้ แม้ในระยะแรกยังอยู่ repository เดียว การแยก repository เป็นงานภายหลังเมื่อ API contract และ deployment เสถียรแล้ว

## 3. ลำดับดำเนินงาน

### ขั้น 0 — ปิด security blockers และกำหนด Public API

ทำก่อนเปิด public web แยก origin ให้ผู้ใช้ภายนอกเข้าถึง:

- ทำ P0 authentication/authorization ที่ API ฝั่ง CMS ให้ครบ โดยแยก public read ออกจาก admin/write ตาม endpoint และ HTTP method
- แก้ session ให้ตรวจสอบได้ฝั่ง server; ห้ามถือว่าการมี cookie อย่างเดียวเท่ากับผ่าน auth
- ตรวจทุก public response ให้คืนเฉพาะข้อมูลที่เผยแพร่แล้ว และไม่เปิด draft หรือข้อมูลภายใน
- กำหนด CORS allowlist จาก origin จริงของ `apps/web/`; ไม่ใช้ wildcard และไม่เปิด credentials สำหรับ public read โดยไม่จำเป็น
- คง Admin UI และ Admin API ไว้ origin เดียวกัน หลีกเลี่ยงการออกแบบ cookie ข้าม origin

**ผ่านเมื่อ:** unauthenticated writes/admin operations ถูกปฏิเสธ, public reads เห็นเฉพาะข้อมูลเผยแพร่, CORS อนุญาตเฉพาะ origin ที่กำหนด และมี focused tests ครอบคลุม policy

### ขั้น A — ล็อกเส้นเขตภายใน CMS

- ระบุ `lib/` เป็น service/domain layer และ `app/api/` เป็น HTTP boundary
- Presentation code ห้าม import `lib/prisma` โดยตรง; server-rendered CMS pages เรียก service, client UI เรียก API
- ย้าย query ของ Admin dashboard เข้า service ใน `lib/` โดยไม่เปลี่ยนผลลัพธ์/หน้าตา
- เพิ่ม ESLint restriction ที่จับทั้ง alias และ relative import ของ Prisma
- normalize relative imports เข้า `lib/` 3 จุดที่ตรวจพบ
- ลบ self-referencing rewrites; ไม่เปลี่ยน URL matcher ให้ใช้ชื่อ route group

**ผ่านเมื่อ:** `tsc`, build ผ่าน; lint ไม่แย่กว่า baseline; ESLint ปฏิเสธ Prisma import จาก presentation; behavior ของ Admin dashboard คงเดิม

### ขั้น B — ตั้งแอป `apps/web/` แยก

- เพิ่ม manifest และ lockfile ของ web app โดยไม่ให้ build ต้อง import CMS source
- ตั้งค่า TS/build/lint/ignore ให้แอป root ไม่ compile source ของ `apps/web/` ปนโดยไม่ตั้งใจ และไม่ให้ dependency artifacts ใน app ย่อยหลุดเข้า Git
- สร้าง layout, styles, shared UI และ API client ของ public web ในขอบเขต `apps/web/`
- กำหนดคำสั่ง start/build และ env vars สำหรับ local development และ deployment แยกกัน

**ผ่านเมื่อ:** `apps/web/` install/build/start ได้จากโฟลเดอร์ของตัวเอง โดยไม่ต้องใช้ Prisma client หรือ import code ภายใน CMS

### ขั้น C — ย้าย public routes และเชื่อม API

- ย้าย public routes ที่ยืนยันว่าจะคงไว้ เช่น `/`, `/{slug}` และหน้าอื่นที่พี่ฆังเลือก ไป `apps/web/`
- เปลี่ยน server-rendered public page ให้ fetch API แทนการ import `lib/page-data`, `lib/menu-data` หรือ `lib/site-config-data`
- ย้าย client fetch ทั้งหมดไปใช้ API client กลางและ `NEXT_PUBLIC_THOTH_API_URL`
- เพิ่ม/ปรับ public read endpoints ที่จำเป็นสำหรับ published pages, menu, site configuration และ project content
- คง routes เดิมใน CMS ชั่วคราวระหว่างทดสอบ แล้วค่อยถอดหลัง public web ใหม่ผ่าน acceptance tests
- ยังไม่ย้ายหรือลบ `frontend/` เดิมโดยไม่มีคำสั่งแยก

**ผ่านเมื่อ:** ค้นใน `apps/web/` แล้วไม่มี import จาก CMS source/Prisma; public route ดึงข้อมูลจาก CMS API ได้; CMS outage แสดง error state ชัดเจน

### ขั้น D — ทดสอบและ deploy แยกใน monorepo

- ทดสอบ CMS/Admin/API และ `apps/web/` แยก process และแยก build
- ทดสอบ public web → CMS API ด้วย CORS, API base URL และ production-like configuration
- กำหนด deployment root, build command, environment variables และ rollback แยกสำหรับสองแอป
- ให้ CMS เป็นแอปเดียวที่ถือ `DATABASE_URL` และ credentials ของ storage/AI providers
- ทำ cutover public routes หลังเปรียบเทียบ behavior และยืนยัน SEO, links, assets, caching และ error handling

**ผ่านเมื่อ:** deploy หรือ rollback แอปหนึ่งได้โดยไม่ต้อง build/deploy อีกแอป และ smoke tests ผ่านครบ

### ขั้น E — แยก repository ภายหลัง

- ทำหลังขั้น D เสถียรและ API contract มีผู้ดูแลชัดเจน
- ย้าย `apps/web/` ไป repository ใหม่พร้อม CI/deployment ของตัวเอง
- คง CMS repository เป็นเจ้าของ database schema/migrations และ credentials
- แยก API versioning/OpenAPI เป็นงานต่อยอดเมื่อมี consumer ภายนอกหรือจำเป็นต้องรักษา compatibility

## 4. ประเด็นที่ยังต้องตัดสินใจก่อนย้ายหน้า

1. **Products:** เนื่องจากไม่มี Product model/API ให้เลือกว่าจะเปลี่ยนหน้ารายการเป็น Projects หรือไม่นำหน้า Products ไป `apps/web/`
2. **Dashboard:** ให้คง public dashboard หรือไม่; ปัจจุบันเรียก `/api/products` ที่ไม่มีจริง และไม่มี public statistics endpoint
3. **Public routes:** ยืนยันชุดหน้าที่ต้องย้าย โดยค่าเริ่มต้นในแผนนี้คือ home และ dynamic published page; หน้า Products/Dashboard รอข้อสรุป
4. **Origins:** กำหนด CMS/API origin และ public web origin ในขั้น deployment; จนกว่าจะมีค่าจริงให้ใช้ env placeholder และห้ามเปิด CORS wildcard

### มติที่ตัดสินแล้ว (เพิ่ม 2026-10-09)

- **Products:** ย้ายเป็น redirect (307) ไป `/projects` — หน้ารายการเปลี่ยนเป็น Projects
- **Dashboard:** ไม่ย้าย — คงใน CMS (ยังเรียก endpoint ที่ไม่มีจริง)
- **Public routes ชุดแรก:** `/`, `/projects`, `/{slug}` (published เท่านั้น) → `apps/web/`; หน้า `/{slug}` กรอง `isPublished` ที่ API และตรวจซ้ำที่หน้า (anon เจอ draft = 404)
- **Projects = public by design (มติ 2026-10-09):** THOTH เป็น open source — รายได้มาจากขายโมดูลและหน้าเว็บ ดังนั้น `GET /api/projects` อ่านทุก Project ได้เสมอ **ไม่มี draft flag โดยเจตนา** และ **field whitelist (`PUBLIC_PROJECT_SELECT`) คงไว้เสมอ** เป็นขอบเขตการเปิดเผยข้อมูล — บันทึกใน `AGENTS.md` section 6 และล็อกด้วย `tests/route-policy.test.mjs` (ห้ามถือว่าการไม่มีสถานะเผยแพร่เป็นข้อบกพร่อง)
- **ยังแยกจากมตินี้ (รอคำสั่ง):** HTML sanitization ของ `page.content` ก่อนแสดงผลสาธารณะ (= Core เฟส 8.1 ใน `docs/FEATURE_MODULE_ROADMAP_2026-10.md`); cutover ถอดหน้า public เดิมออกจาก CMS (ขั้น D)

## 5. ข้อจำกัดด้านการดำเนินงาน

- เอกสารนี้เป็นแผน/สถานะ; ขั้น 0/A/B/C สร้าง source ของ `apps/web/` แล้ว — **ขั้น D/E (integration test, deploy แยก, cutover) ยังไม่เริ่ม**
- ไม่แก้ `.env.local`, ไม่พิมพ์ secret และไม่คัดลอก secret ข้ามแอป
- ไม่ลบ `frontend/` หรือข้อมูลเดิม; การถอด public routes เดิมทำหลัง cutover ผ่านการทดสอบ
- ไม่ deploy production จนกว่า security blockers ในขั้น 0 ถูกปิดและตรวจสอบแล้ว

## สรุป

> **THOTH จะเป็น CMS app ที่รวม Admin UI + API + database access; public web จะเป็น `apps/web/` ที่ build/deploy อิสระและใช้ public API เท่านั้น — เริ่มใน monorepo ก่อน แล้วแยก repository ภายหลัง**
