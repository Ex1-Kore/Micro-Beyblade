# แผนพัฒนาฟีเจอร์และโมดูลเพิ่มเติม (Feature & Module Expansion Roadmap)

> จัดทำ: **2026-10-10 โดย อัล (Al Khung - พี่สี่)** · ปรับทบทวน: **2026-10-10 โดย ธาร**
> สถานะ: **เสนอเพื่อพิจารณา — ขอบเขตรอบนี้จำกัดเฉพาะ Core; ยังไม่อนุมัติให้เริ่ม implementation**
> วัตถุประสงค์: ต่อเนื่องจาก `UPDATE_PLAN_2026-10.md` และ `SPLIT_HEADLESS_PLAN_2026-10.md` โดยเน้นความปลอดภัย โครงสร้างพื้นฐาน และความสามารถหลักของ CMS เท่านั้น

---

## 0. Baseline และเงื่อนไขก่อนเริ่ม

แผนนี้เป็น roadmap เป้าหมาย ไม่ใช่การยืนยันว่าเฟส 1–7 เสร็จทั้งหมดแล้ว เอกสารสถานะที่มีอยู่ไม่ตรงกันทุกจุด: `UPDATE_PLAN_2026-10.md` ยังมีสถานะก่อนการเปลี่ยนแปลงวันที่ 10 ต.ค. ขณะที่ `AGENTS.md` บันทึกงานที่ทำเพิ่มภายหลัง และ `SPLIT_HEADLESS_PLAN_2026-10.md` ระบุว่างาน deploy/cutover ขั้น D/E ยังไม่เริ่ม

ก่อนอนุมัติงาน implementation ให้ทบทวนสถานะจากโค้ดและทดสอบจริง แล้วปรับเอกสารแผนหลักให้เป็น baseline เดียวกัน โดยเฉพาะ:

- งาน P0 ที่ยังเปิดอยู่ (รวมการจำกัด brute-force login) และสถานะ HTML sanitization
- การตัดสินใจและการแก้ไขหน้า Products/Dashboard ที่เรียก API ซึ่งไม่มีอยู่
- สถานะ migration strategy; ปัจจุบันแผนหลักระบุว่ายังไม่มี `prisma/migrations/`
- งาน `apps/web/` ขั้น D/E: integration test, deployment แยก และ cutover

**ไม่ถือว่างานใดเสร็จจากข้อความใน roadmap นี้เพียงอย่างเดียว** และการอนุมัติ roadmap ไม่เท่ากับอนุมัติให้เปลี่ยน schema, ใช้ production database หรือ deploy

---

## เฟส 8: ความปลอดภัยและโครงสร้างพื้นฐาน (Core Foundation)

### 8.1 ปิด XSS ของเนื้อหา — งานเร่งด่วน แยกจากการเลือก Editor

ปัจจุบัน `Page.content` เป็น HTML และมีการ render ด้วย `dangerouslySetInnerHTML` ทั้ง CMS และ `apps/web/`; ตัว editor ยังนำค่า HTML เดิมกลับเข้า `contentEditable` ด้วย การเปลี่ยนไปใช้ block editor **เพียงอย่างเดียวไม่ใช่มาตรการป้องกัน XSS**

ขอบเขตที่ต้องตัดสินและทดสอบ:

- เลือกแนวทางหลักระหว่าง sanitize HTML ด้วย allowlist ที่เหมาะกับเนื้อหาที่รองรับ หรือ render block document ผ่าน renderer ที่ไม่ตีความ input เป็น HTML
- ครอบคลุมทั้งเนื้อหาใหม่และข้อมูล HTML เดิม; หากแปลงเป็น JSON ต้องมี parser/migration ที่ตรวจผลลัพธ์ได้และมีแผนย้อนกลับ
- ตรวจทุกจุดรับ/แสดงผล รวม admin preview, public route ใน CMS และ `apps/web/`; ป้องกันการแทรกผ่าน pasted HTML, event attributes, scriptable URL และ payload ที่เข้ารหัส/ปรับรูปแบบ
- ห้ามถือว่าการป้องกันฝั่ง editor เพียงจุดเดียวเพียงพอ เพราะ API หรือข้อมูลเดิมอาจข้าม editor ได้

**ผ่านเมื่อ:** มี security tests ยืนยันว่า payload อันตรายไม่ทำงานในทุก render surface, content ที่อนุญาตยังแสดงได้ตามต้องการ และทดสอบกับข้อมูลเดิมได้ก่อน rollout

### 8.2 ตัดสินใจและย้าย Rich-text/Block Editor

ประเมินการคง editor ปัจจุบันเทียบกับ Tiptap, Editor.js หรือทางเลือกที่ดูแลต่อเนื่องได้ โดยเลือกหลังระบุความต้องการด้าน formatting, links, images, embeds, accessibility, bundle size และรูปแบบข้อมูลแล้ว

- กำหนด document schema และเวอร์ชัน, การตรวจ input ฝั่ง server และการแสดงผลแบบปลอดภัย
- วางแผนแปลง `Page.content` เดิม, รายงานรายการที่แปลงไม่ได้ และเก็บวิธีกู้คืนข้อมูล
- ทำ migration แบบทดสอบได้กับสำเนาข้อมูลก่อน production; ห้ามเปลี่ยนรูปแบบการเก็บข้อมูลโดยไม่มีแผน rollback

**ผ่านเมื่อ:** round-trip เนื้อหาที่รองรับได้, ข้อมูลเก่าไม่สูญหายโดยเงียบ, tests ครอบคลุม schema และการแสดงผลปลอดภัยในทั้งสองแอป

### 8.3 Webhooks สำหรับการเชื่อม CMS กับ Public Web

สร้างการจัดการ endpoint และ event สำหรับแจ้งระบบภายนอกเมื่อเกิดการเปลี่ยนแปลงที่กำหนด เพื่อให้ public web ขอ revalidation ได้ โดยไม่ผูก implementation กับ Next.js API ภายในของ `apps/web/`

- ระบุ event ตามโมเดลจริง เช่น Page publish/unpublish/update และ Project create/update; **อย่าใช้คำว่า “Published Project”** เพราะ Project ไม่มีสถานะ publish ตาม policy ปัจจุบัน
- ป้องกัน SSRF: ตรวจ scheme/host และปฏิเสธ loopback, private/link-local/reserved IP รวมถึงการ redirect ไปยังปลายทางต้องห้าม; พิจารณา DNS rebinding และตรวจปลายทางก่อนเชื่อมต่อ
- ลงนาม payload ด้วย secret ต่อ endpoint, ใส่ timestamp/event ID เพื่อป้องกันปลอมแปลงและ replay; แสดง secret แบบปกปิดและจัดเก็บผ่านกลไก secret ที่ปลอดภัย
- กำหนด timeout, retry/backoff, idempotency, การจัดการ failure และ retention/log redaction; หลีกเลี่ยงการบันทึก secret หรือข้อมูลส่วนบุคคลใน log
- จำกัดสิทธิ์ดู/จัดการ endpoint และ log; ทดสอบไม่ให้ webhook กลายเป็นทางออกจากเครือข่ายภายใน

**ผ่านเมื่อ:** tests ครอบคลุม authorization, signing/timestamp, replay, SSRF/redirect/DNS cases, retry/idempotency และการลบ/ปกปิดข้อมูลลับ

---

## เฟส 9: แกนกลางสำหรับทีมและงานบรรณาธิการ

### 9.1 Role-Based Access Control (RBAC)

`User.role` ปัจจุบันเป็น `String` ค่าเริ่มต้น `"user"`; อย่าสมมติว่าระบบมีเพียง `superadmin` หรือเปลี่ยน role เดิมก่อนสำรวจค่าที่ใช้อยู่จริง

- จัดทำ inventory ของ role/user ปัจจุบันและ permission matrix ตาม resource/action (อ่าน, สร้าง, แก้ไข, publish, ลบ, จัดการผู้ใช้/ตั้งค่า)
- กำหนดผู้ดูแลสูงสุดและกติกาป้องกันการล็อกตัวเองออก/ลบผู้ดูแลคนสุดท้าย
- บังคับ authorization ใน API/service boundary ไม่พึ่งการซ่อนปุ่มใน UI; แยก authentication ออกจาก authorization
- วางแผน migration แบบ backward-compatible และทดสอบ role เก่าก่อนบังคับค่าชุดใหม่

**ผ่านเมื่อ:** ทุก write/admin action ถูกตรวจสิทธิ์จากฝั่ง server, permission tests ครบทุก role/action และ migration ไม่ยกระดับสิทธิ์ผู้ใช้เดิมโดยเงียบ

### 9.2 Revision History

- ระบุ resource และ field ที่เก็บใน snapshot, ผู้แก้ไข, เวลา, ความสัมพันธ์กับ publish state และ retention ก่อนออกแบบตาราง
- บันทึก revision ให้ atomic กับการบันทึกเนื้อหา; กำหนดการแสดง diff และการ restore ที่สร้าง revision ใหม่เพื่อคง audit trail
- กำหนดสิทธิ์ดู/restore, จำนวนหรืออายุที่เก็บ และผลต่อขนาดฐานข้อมูล
- วาง migration และ rollback strategy ให้สอดคล้องกับแนวทาง Prisma migrations ที่ตกลงใน baseline

**ผ่านเมื่อ:** tests ยืนยัน snapshot consistency, restore/rollback, permissions, audit trail และ retention behavior

---

## Gate: Core พร้อมก่อนเริ่มขยาย

เมื่อทำงาน Core ในเฟส 8–9 เสร็จแล้ว ให้หยุดประเมินความพร้อมก่อนเริ่มงานขยายฟีเจอร์หรือโมดูล โดยตรวจหลักฐานจากระบบจริงว่า:

- งาน Core ที่อนุมัติไว้ผ่าน acceptance tests และไม่มี P0 ที่ทราบแล้วยังค้างโดยไม่มีแผนลดความเสี่ยงที่พี่ฆังยอมรับ
- schema changes มี migration ที่ทดสอบแล้ว และมีแนวทาง backup/restore หรือ rollback ที่พิสูจน์ได้
- typecheck, build, lint และ focused/security tests ผ่านตามเกณฑ์ repository
- `apps/web/` เชื่อม CMS API และผ่าน integration/deployment/cutover checks ที่เกี่ยวข้องใน `SPLIT_HEADLESS_PLAN_2026-10.md` ก่อนถือว่าพื้นฐาน headless พร้อม
- error handling, logs และการปฏิบัติงานหลัง deploy เพียงพอให้ตรวจพบและวินิจฉัยปัญหาได้

**ขยายต่อได้เมื่อ:** ทบทวนผลการตรวจ Core แล้ว และพี่ฆังอนุมัติ scope ของฟีเจอร์หรือโมดูลระยะขยายเป็นรายงาน/เฟส การผ่าน gate นี้ไม่ใช่การอนุมัติโดยอัตโนมัติ

---

## นอกขอบเขต Core รอบนี้ — พักไว้สำหรับ roadmap ภายหลัง

หัวข้อต่อไปนี้ยังไม่รวมในแผนดำเนินงานรอบนี้ และไม่ควรเริ่ม scaffold/schema/implementation จนกว่าจะทบทวนและอนุมัติขอบเขตใหม่:

- **Form Builder & Leads:** โมดูลเชิงพาณิชย์; ต้องออกแบบ public submission security, anti-abuse และการคุ้มครองข้อมูลส่วนบุคคล
- **Advanced SEO & Sitemap:** งาน public web/product; ควรกำหนด locale และ URL strategy ก่อน และให้ `apps/web/` เป็นเจ้าของ sitemap
- **E-Commerce:** ผลิตภัณฑ์/โมดูลขนาดใหญ่; แยกจากการแก้หน้า Products ที่เสียซึ่งเป็นงานค้างในแผนหลัก
- **i18n / Multi-language:** เปลี่ยน data model, API, routing และ SEO; ควรตัดสินใจก่อนเริ่ม SEO หรือ E-Commerce
- **Analytics Dashboard:** การเชื่อม provider ภายนอกและข้อมูล credential; ต้องมีแบบ secret handling และ privacy ก่อน

การระบุหัวข้อเหล่านี้ไว้ตรงนี้เป็นเพียงบันทึก backlog ไม่ใช่การอนุมัติให้เริ่มทำ

---

## ลำดับการทำงาน

1. **ทำ Core ให้มั่นคงก่อน:** ลำดับ baseline → XSS → migration strategy → Webhooks → RBAC → Revision ตามขอบเขตที่อนุมัติ
2. **ผ่าน Core readiness gate:** ตรวจ acceptance, tests, migration/recovery และความพร้อมของ `apps/web/`
3. **จึงค่อยขยาย:** เลือกหัวข้อจาก backlog นอกขอบเขต Core มาจัดทำ scope/ความเสี่ยง/เกณฑ์ผ่าน และรออนุมัติใหม่

แต่ละงานที่เปลี่ยนหลายไฟล์หรือ schema ต้องทวนขอบเขตและรออนุมัติก่อน implementation ตามกติกาโปรเจกต์ การเพิ่มตารางทุกครั้งต้องตรวจ migration/data-loss impact และปรับ SQL setup หากยังคงแจกไฟล์นั้น การเปลี่ยนแปลงต้องมี focused tests และผ่าน typecheck/build/lint ตามแนวทางของ repository

> **หลักการของ roadmap:** Core แน่นก่อน แล้วค่อยขยาย — งาน backlog ระยะขยายไม่เริ่มคู่ขนานและไม่เริ่มอัตโนมัติเมื่อ Core เสร็จ ต้องผ่าน readiness gate และรออนุมัติ scope ใหม่ก่อน
