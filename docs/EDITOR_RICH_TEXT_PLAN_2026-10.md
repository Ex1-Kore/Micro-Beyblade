# Editor / Rich-text Plan (8.2) — Tiptap + JSON Block Document

> สร้าง: **2026-10-10 โดย ฌอน (opencode)** · อัปเดตสถานะ: **2026-10-10 — อนุมัติแล้ว, implement ครบทุกขั้น (0–5 เสร็จ); DB prod apply schema แล้ว (`prisma db push`, add-only) + migration dry-run = 0 rows**
> โครงงาน: THOTH `2.0.0-beta.1` · แผนแม่: `docs/UPDATE_PLAN_2026-10.md` (เฟส 8.2)

## สถานะความคืบหน้า (อัปเดต 2026-10-10)

| ขั้น | สถานะ | หมายเหตุ |
| --- | --- | --- |
| ขั้น 0 (deps + converter + validator + tests) | ✅ เสร็จ | Tiptap 3.31.4 ทุกตัว · `lib/content/{block-document,html-to-json,json-to-html}.ts` · `tests/block-document.test.mjs` (16 ตัว) — npm test 80/80 |
| ขั้น 1 (schema + dual-write) | ✅ เสร็จ | schema เพิ่ม `contentJson/contentVer` + dual-write ใน API routes + `PRODUCT_CMS_SETUP.sql` · **DB prod apply แล้ว 2026-10-10** (`prisma db push` — diff add-only 2 คอลัมน์, ไม่มี data loss; Prisma Client generate แล้ว) |
| ขั้น 2 (editor Tiptap) | ✅ เสร็จ | `components/admin/tiptap-editor.tsx` (B/I/U/S, H1-3, P, lists, quote, hr, link, image, table suite, undo/redo, clear) + wire เข้า `app/admin/pages/page.tsx` (ส่ง `contentJson`) + `tests/page-input.test.mjs` (10 ตัว) — npm test 90/90, tsc 0, lint 0 err/20 warn, build exit 0 · validator เพิ่มโครงสร้างบังคับ nesting ตรง Tiptap schema (image = block, hardBreak = inline) |
| ขั้น 3 (AI auto-post) | ✅ เสร็จ | `lib/automation/google-ai.ts` ขอ `contentJson` เพิ่มจาก AI (parse string/object) · `resolveCampaignPageContent` ใน `lib/content/page-input.ts` (JSON wins → validate → dual-write; HTML-only → `htmlToBlockDocument` backfill; JSON invalid → ไม่ทิ้งบทความ คืน HTML) · `service.ts` `runCampaign` บันทึก `contentJson/contentVer` — tests +3 (93/93), tsc 0, lint 0 err/20 warn, build exit 0 |
| ขั้น 4 (migration) | ✅ เสร็จ (0 rows) | `scripts/migrate-page-content-json.ts` — dry-run เป็นค่าเริ่มต้น, `--apply` ค่อยเขียน, `--limit N`; backfill `contentJson/contentVer` จาก `content` (HTML) ผ่าน `htmlToBlockDocument` — **ไม่แตะคอลัมน์ `content`**; npm script `migrate:page-json` (ใช้ `node --env-file=.env.local`) · **รันกับ prod แล้ว 2026-10-10: rows needing backfill = 0** (ยังไม่มีหน้า legacy) |
| ขั้น 5 (cutover renderer) | ✅ เสร็จ | `lib/content/{render-model,render-react}.ts` (root) + สำเนา self-contained ใน `apps/web/lib/content/` — render `contentJson` เป็น **React element** (allowlist-by-construction: unknown node/mark ถูกข้าม, URL re-normalize), ไม่มี `dangerouslySetInnerHTML` บนเส้น JSON; fallback HTML+sanitize เมื่อ JSON ไม่มี/ว่าง · wire `app/[slug]/page.tsx` + `apps/web/app/(page)/[slug]/page.tsx` · `apps/web/lib/types.ts` เพิ่ม `contentJson/contentVer` · `normalizeUrl` เข้มขึ้น (block scheme แบบมี whitespace/control คั่น) ทั้ง root + apps/web · `tests/block-renderer.test.mjs` (11 ตัว, รวม drift-guard root↔apps/web) — npm test 104/104, tsc 0 (root+apps/web), lint 0 err/20 warn, build exit 0 (root + apps/web) |

---

## 1. มติที่ตกลงแล้ว (พี่ฆัง 2026-10-10)

| หัวข้อ | มติ |
| --- | --- |
| Editor ใหม่ | **Tiptap** (v3.31.4, React 19 compatible) |
| รูปแบบจัดเก็บ | **JSON block document** (versioned + validator) |
| ขอบเขตรอบนี้ | ประเมิน + เสนอแผนก่อนแตะ schema (รอบนี้ = เอกสารนี้, ยังไม่ implement) |
| API ระหว่าง migration | **Dual-write ชั่วคราว** — เก็บ `contentJson` ใหม่ + คง `content` (HTML legacy) ส่ง API เหมือนเดิม |
| AI auto-post | **JSON + converter fallback** — AI สร้าง JSON block ตรงๆ; fallback HTML→JSON ผ่าน `@tiptap/html` |
| Rollback | `content` อยู่ตลอด migration → ย้อน editor/หน้าได้โดยไม่เสียข้อมูล |

---

## 2. สภาพปัจจุบัน (ข้อเท็จจริงตรวจจากไฟล์ 2026-10-10)

### Stack
- Next.js 16.4.0 (root), React 19.2.4, Prisma 6.19.3 → PostgreSQL
- Editor เดิม: `components/admin/rich-text-editor.tsx` (142 บรรทัด) — contentEditable + `dangerouslySetInnerHTML` ใช้คืนค่าในโหมดแก้ไข (legacy self-XSS เฉพาะ admin; server sanitize ทุกการบันทึก)
- ใช้งาน 1 จุด: `app/admin/pages/page.tsx` (249 บรรทัด)

### จุดที่กระทบ (นับจากโค้ดจริง)
| จุด | ไฟล์:line | สภาพ |
| --- | --- | --- |
| Schema | `prisma/schema.prisma:96` | `content String @default("")` (HTML string) |
| Write API (create) | `app/api/pages/route.ts:33` | `content: sanitizePageHtml(content)` |
| Write API (update) | `app/api/pages/[id]/route.ts:49` | `content: sanitizePageHtml(content)` |
| Read/Render | `app/[slug]/page.tsx:95` | `dangerouslySetInnerHTML` + `sanitizePageHtml(page.content)` |
| Read/Render (web แยก) | `apps/web/app/(page)/[slug]/page.tsx:129` | `dangerouslySetInnerHTML` + `sanitizePageHtml(page.content)` |
| AI auto-post | `lib/automation/google-ai.ts:79`, `lib/automation/service.ts:152` | ให้ AI สร้าง `contentHtml` (HTML) → เก็บ `content` ตรงๆ + `stripHtml` ทำ excerpt |
| Script legal | `scripts/update-legal-content.ts:69–107` | upsert `content` เป็น HTML string -->

### version packages (registry 2026-10-10)
- `@tiptap/react` / `@tiptap/core` / `@tiptap/starter-kit` / `@tiptap/extension-link` / `@tiptap/html` = **3.31.4** ทั้งชุด · peerDeps `@types/react-dom ^17||^18||^19` → เข้ากัน React 19 ✅

---

## 3. แผน Target Schema (ยังไม่ apply)

```prisma
model Page {
  ...
  content     String   @default("")   // LEGACY HTML — เก็บไว้ตลอด migration, ตัดทีหลัง
  contentJson Json?                    // NEW — JSON block document (versioned)
  contentVer   Int      @default(1)    // version ของ schema document
  ...
}
```

- ใช้ `Json` ชนิด Prisma 6.x → PostgreSQL `jsonb` ✅
- **Migration ยังไม่ทำ** จนกว่าพี่อนุมัติ (กฎ project: เปลี่ยน schema ต้อง approve)

---

## 4. JSON Block Document: รูปแบบ

V1 — สอดคล้องกับ JSON output ของ Tiptap 3 (ProseMirror document):

```json
{
  "version": 1,
  "doc": {
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "หัวข้อ" }] },
      { "type": "paragraph", "content": [{ "type": "text", "text": "เนื้อหา" }] },
      { "type": "image", "attrs": { "src": "...", "alt": "..." } }
    ]
  }
}
```

**หมายหลักสำคัญ:**
- **ไม่เก็บ HTML ในผู้ใช้** — renderer ฝั่ง public แปลง JSON → React element (ไม่อิง `dangerouslySetInnerHTML`)
- validator จำกัดชุด node (`lib/content/block-validator.ts` ใหม่): `paragraph, heading{1-6}, blockquote, codeBlock, image(src/alt/width/height), horizontalRule, table/tableRow/tableHeader/tableCell, bulletList/orderedList/listItem, text, link` — นอกนั้น reject
- ยังคง sanity check URL (`normalizeUrl` เดิม จาก `lib/content/sanitize.ts`) สำหรับ `src`/`href` — XSS ปิดที่โครงสร้าง + URL

---

## 5. ขั้นตอน Implement (เมื่อได้รับอนุมัติ — ตามลำดับ)

### ขั้น 0 — เตรียมของ (ไม่แตะ schema)
1. `npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link` (deps)
2. `npm i -D @tiptap/html` (สำหรับ converter)
3. เขียน `lib/content/block-validator.ts` + `lib/content/html-to-json.ts` (`@tiptap/html`) + `lib/content/json-to-html.ts` (renderer helper, single source ได้)
4. **Tests:** `tests/block-document.test.mjs` — validator (reject `script`/`iframe`/event attr), html↔json roundtrip, URL blocklist

### ขั้น 1 — Schema + dual-write (ต้องอนุมัติก่อน)
5. เพิ่ม `contentJson Json?` + `contentVer Int @default(1)` ใน `prisma/schema.prisma` → `npx prisma generate`
6. `docker compose`/Neon: `npx prisma db push` (**ตรวจ `--diff` ก่อน** ตามกติกา; Prod Prisma Postgres แยกทำพร้อมกันถ้าพี่สั่ง) — **ยังไม่ immigration ข้อมูล**
7. Write API (`app/api/pages/route.ts`, `[id]/route.ts`): รับทั้ง `content` (HTML, sanitize เดิม) **หรือ** `body.contentJson` — ถ้ามี JSON ให้เก็บทั้ง 2 (`content` = `json-to-html(json)` สำหรับ renderer เดิมที่ยังอ่าน HTML, `contentJson`);
   - ทั้งสองทางผ่าน validator ก่อน >> เก็บ
8. Read API: ยังส่ง `content` (HTML) เหมือนเดิม → `apps/web`/ลูกค้าไม่พัง (dual-write)

### ขั้น 2 — Editor Tiptap
9. เขียน `components/admin/tiptap-editor.tsx` (ใหม่) ใช้ `@tiptap/starter-kit` + `extension-link` + toolbar step (bold/italic/heading/link/quote/code/image/list) — output เป็น JSON string
10. `app/admin/pages/page.tsx`: สลับใช้ editor ใหม่; mode edit แสดง JSON; โหมด "ดู HTML ดิบ" เก็บไว้เป็น dev-only
11. `rich-text-editor.tsx` เดิม **คงไว้** (ยังไม่ลบ ตามกฎห้ามลบโดยไม่สั่ง) — เปลี่ยนเป็น import เฉพาะที่เหลือ หรือ mark deprecated

### ขั้น 3 — AI auto-post
12. `lib/automation/google-ai.ts`: เพิ่ม option ให้ AI ตอบ `contentJson` (schema เดียวกับข้อ 4) + `contentHtml` (เดิม)
13. `lib/automation/service.ts`: ถ้าได้ JSON → validate + dual-write; ไม่ได้/เพี้ยน → fallback `@tiptap/html` แปลง `contentHtml`→JSON (แล้ว validate อีกที); เก็บ `output` ตามเดิม

### ขั้น 4 — Migration ข้อมูล Legacy (script 1 รอบ)
14. `scripts/migrate-page-content-json.ts`: อ่านทุก `Page` ที่ `contentJson IS NULL` → `@tiptap/html` แปลง `content`→JSON → validate → เขียน backfill (dual-write) — idle-run (--dry-run) ก่อนจริง
15. เขียนวิธี rollback (ดู §6)

### ขั้น 5 — Cutover renderer (ขั้นนี้แยกเป็นอิสระ — ตามความพร้อม) — ✅ เสร็จ 2026-10-10
16. `app/[slug]/page.tsx` + `apps/web/app/(page)/[slug]/page.tsx`: render จาก `contentJson` ผ่าน renderer (React element) แทน `dangerouslySetInnerHTML`; ยัง fallback `content` (HTML+sanitize) สำหรับหน้า legacy ที่ยังไม่มี JSON — **ทำแล้ว**: `lib/content/render-model.ts` (tree) + `render-react.ts` (`createElement`), สำเนาใน `apps/web/lib/content/` (split plan), `tests/block-renderer.test.mjs`
17. หลัง cutover ผ่านสักระยะ → เปิดใจกว้างเรื่องลบ `content` column + `rich-text-editor.tsx` + sanitize ของ render (ต้องมติใหม่) — **ยังไม่ทำ (รอมติ)**

---

## 6. Rollback Plan

- **ช่วงขั้น 1–4:** `content` (HTML) เก็บเสมอ และ API ส่ง HTML → ยกเลิกได้โดย (ก) เอาออกจาก dual-write, (ข) ลบ `contentJson` ไม่เสียหน้า
- **ช่วงขั้น 5:** ถ้า renderer ใหม่มีปัญหา → กลับไป render `content` เหมือนเดิม (fallback path ยังอยู่ในโค้ด) — แค่ flip flag
- **Database:** ไม่มีการ drop column จนกว่าพี่สั่ง; `prisma db push --diff` ใช้ก่อนทุก apply บนทั้ง Neon + Prod

---

## 7. Risk / ทางเลือกที่ยังเปิด (แผนนี้ถือว่า)

| Risk | ลดยังไง |
| --- | --- |
| `@tiptap/html` แปลง HTML แปลกๆ ไม่ตรง expectations | Tests roundtrip + validator เข้ม + dry-run ตรวจ `--diff` ก่อน backfill |
| AI ส่ง JSON เพี้ยน | Fallback HTML→JSON + validate 2 ชั้น + prompt ตัวอย่าง schema |
| `apps/web`/ลูกค้าเก่าอ่าน format | Dual-write คง HTML ผ่าน API จน cutover |
| Editor bundle ใหญ่ขึ้น (Tiptap ~500–600KB unpacked@react) | ประเมิน `next build` size หลังขั้น 1; ถ้าสูง→ code-split editor (dynamic import เฉพาะหน้า `/admin`) |

---

## 8. สิ่งที่จะ**ไม่**ทำในรอบนี้
- ไม่ลบ `content` column / `rich-text-editor.tsx` / sanitize render (ต้องมติใหม่)
- ไม่เริ่ม implementation จนกว่าพี่อนุมัติขั้น 1 (schema) — เอกสารนี้คือประตูอนุมัติ

---

## 9. สถานะเปิด (`open`)
- [ ] พี่อนุมัติแผน Schema ใน §3 + ขั้นตอน §5 (โดยเฉพาะขั้น 1 แตะ DB)
- [ ] (ตัดสินใจทีหลัง) ช่วง cutover step 5 — ยังไม่กำหนดวัน
- [ ] ลบ legacy หลัง migration — ยังไม่มีมติ