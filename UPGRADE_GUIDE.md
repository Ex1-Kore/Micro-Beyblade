# Micro Headless CMS - คู่มือการอัปเดตและติดตั้งใหม่ (2026-10-10)

คู่มือนี้สรุปขั้นตอนที่จำเป็นหลังจากมีการนำโค้ดล่าสุดจาก `THOTH` มายัง CMS ชุดหลักนี้ โดยครอบคลุมทั้งการจัดการไฟล์และฐานข้อมูล

> **สำคัญ:** ตั้งแต่ v2.0.0-beta.1 ระบบใช้ **Prisma Migrate** แทน `db push` — ฐานข้อมูลที่ provision แล้วด้วย `db push` ต้องรัน `prisma migrate resolve --applied 20261010120000_init` ครั้งเดียวก่อน deploy ครั้งต่อไป

---

## 🚀 ขั้นตอนการติดตั้ง/อัปเดต

### 1. การเตรียมสภาพแวดล้อม
- ย้ายไฟล์โปรเจกต์มายังโฟลเดอร์นี้ **ยกเว้นโฟลเดอร์ `.git` และไฟล์ `.env`**
- ตรวจสอบไฟล์ `.env.local` ให้แน่ใจว่าเชื่อมต่อกับ Database เดิมที่ต้องการ

### 2. ติดตั้ง Dependencies
ใช้คำสั่งด้านล่างเพื่ออัปเดต Library ใหม่ๆ (รวมถึง Prisma Client):
```bash
npm install
```

### 3. อัปเกรดโครงสร้างฐานข้อมูล (Database Schema)

**ติดตั้งใหม่ (Fresh DB):**
```bash
npx prisma migrate deploy
npx prisma generate
```

**อัปเดตจากเวอร์ชันที่ใช้ `db push` ก่อนหน้า (ต้องทำครั้งเดียว):**
```bash
# 1. บันทึก baseline migration ว่า applied แล้ว (ไม่สร้างตารางซ้ำ)
npx prisma migrate resolve --applied 20261010120000_init

# 2. จากนี้เป็นต้นไป ใช้ migrate deploy ตามปกติ
npx prisma migrate deploy
npx prisma generate
```

*หมายเหตุ: baseline migration `20261010120000_init` มีโครงสร้าง 12 ตารางครบถ้วนตาม `prisma/schema.prisma` — การ resolve จะไม่สร้างตารางซ้ำ แค่บันทึกว่า migration นี้ถือว่า applied แล้ว*

### 4. เตรียมเนื้อหาเริ่มต้น (Legal & Seeding)
ระบบใหม่ต้องการเนื้อหาสำหรับหน้า Privacy Policy, Terms, และ Cookies เพื่อใช้ในส่วน Footer ของ Frontend:
```bash
npx tsx scripts/update-legal-content.ts
```

---

## 🛠 ฟีเจอร์ใหม่ที่บรรจุเพิ่มเข้ามา (v2.0.0-beta.1)
- **Admin Configuration:** รองรับการจัดการลิงก์ GitHub, Twitter, LinkedIn, Privacy, Terms, Cookies และเพิ่มตัวเลือกสี Accent Staff
- **Dynamic Legal Pages:** ระบบรองรับการสร้างและแก้ไขหน้าเนื้อหาแบบ Dynamic ผ่านเมนู `Pages`
- **Staff Repository Manager:** ระบบจัดการพอร์ตโฟลิโอเชิงลึกสำหรับสมาชิกแต่ละคนในทีม
- **Improved API:** รองรับการ Fetch หน้าเพจผ่าน `slug` โดยตรง
- **Security Hardened:** XSS sanitization (Core 8.1), upload content-sniff, login brute-force protection, rate limiting
- **Editor Migration (Core 8.2):** Tiptap 3.31.4 + JSON block document + dual-write + cutover renderer

---

## ✅ การตรวจสอบความสมบูรณ์
รันคำสั่ง Build เพื่อเช็คว่าไม่มีไฟล์ใดสูญหายหรือผิดพลาด:
```bash
npm run build
```
รัน test suite:
```bash
npm test
```
รัน lint & typecheck:
```bash
npm run lint && npx tsc --noEmit
```

หาก Build/Test/Lint สำเร็จทั้งหมด แสดงว่าระบบพร้อมให้บริการครับ