# Changelog

All notable changes to Micro Headless CMS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.2] - 2026-10-11

### 🔒 Security
- **Secret feature readiness check** — non-fatal `GET /api/system/bootstrap` → `features.secrets` + admin database card
- **Login brute-force protection** — 2-tier buckets (per IP + per account) with short-circuit, 429 + `Retry-After`
- **Upload content sniff** — magic bytes validation (JPEG/PNG/WebP/GIF) matching declared MIME; SVG removed from allowlist
- **Rate limiting** — upload endpoints (30 req/min default, hard-cap 10k buckets) + login endpoints

### 🧪 Testing
- **151 automated tests** — `node --test tests/*.test.mjs` (14 files: secrets-crypto, automation-helpers, upload-guard, login-limit, secret-readiness, etc.)

### 📚 Documentation
- **UPDATE_PLAN** แพส 1–7 เสร็จสมบูรณ์ · **SELF_HOSTING/UPGRADE_GUIDE** อัปเดต migration baseline + `migrate deploy`
- **README** sync: Node `>=20.9.0`, 151 tests, 15 admin pages, 30 API routes, extensions hello-module

### 🏗️ Repository / Infrastructure
- **Prisma Migrations baseline** — `prisma/migrations/20261010120000_init/` + `migration_lock.toml`
- **Docker entrypoint** เปลี่ยนเป็น `prisma migrate deploy` · `docker-compose` require `POSTGRES_PASSWORD` (no default)
- **CI lint gate** เปิดแล้ว (`continue-on-error` removed) · `engines.node: >=20.9.0`
- **Dead code removed** — `frontend/` (1,877 LOC) + `/products`, `/dashboard` pages + product marketing copy

### 🔧 Developer Experience
- **New test files**: `secrets-crypto.test.mjs`, `automation-helpers.test.mjs`, `api-smoke.test.mjs` (opt-in)
- **Release workflow** — GitHub Actions auto on version-bump to main, waits for Vercel preview

## [2.0.0-beta.1] - 2026-10-09

### 🔒 Security
- **Signed session cookies** — session ออกเป็น signed token ผ่าน `SESSION_SECRET` (ขาดแล้ว throw)
- **Write API guards** — `guardApiSession` ครอบ API route ที่เขียนข้อมูลทั้งหมด (21 routes)
- **Fail-closed cron auth** — `isCronAuthorized` ไม่มี fail-open อีกต่อไป
- **Env hygiene** — `.env.example` sanitize ค่าจริงออกแล้ว; `.gitignore` กัน `.env*` / `public/uploads/` / `*.log`

### 🧪 Testing
- **30 automated tests** — `node --test tests/*.test.mjs` (route-policy + session) ผ่าน 100%

### 📚 Documentation
- **README.md เขียนใหม่** — architecture แยก CMS / `apps/web`, นโยบายธุรกิจ, คำสั่งจริงที่รันตรวจแล้ว
- **จัดระเบียบราก** — ลบเอกสารเก่า/ขยะ 16 ไฟล์ เหลือ `.md` 11 ไฟล์
- **`AGENTS.md` + `docs/UPDATE_PLAN_2026-10.md` + `docs/SPLIT_HEADLESS_PLAN_2026-10.md`** สร้าง/อัปเดต

### 🏗️ Repository
- **Git initialized** — commit แรก `a6eeca1` (164 ไฟล์) · remote `origin` (GitHub) + `gitea` (LAN)
- **Version 2.0.0-beta.1** — repo ตั้งชื่อ `THOTH-V2` · backup ลงดิสเรียบร้อย

## [1.0.0-beta.1] - 2026-04-11

### ✨ Added

#### Core Headless CMS System
- **Content Management Framework** - Modular content management with Prisma ORM
- **REST API** - Full-featured REST API for all content types
- **TypeScript Support** - Type-safe codebase with automatic type generation
- **PostgreSQL Integration** - Flexible database schema management with Prisma migrations

#### Content Modules
- **Projects Module** - Portfolio project management with galleries, demos, and tools
- **Staff Module** - Team member profiles with skills, GitHub links, and portfolio
- **Pages Module** - Dynamic page editor with slug-based routing
- **Categories Module** - Hierarchical content organization
- **Media Library** - Asset management with S3 and local storage support
- **Navigation Builder** - Dynamic menu creation and management

#### Authentication & Security
- **Admin Authentication** - Secure token-based session management
- **Role-Based Access Control** - Protected admin routes with session verification
- **Security Headers** - Comprehensive security headers (Content-Type, X-Frame-Options, XSS Protection)
- **Password Management** - Secure password hashing with bcryptjs
- **Setup Wizard** - Initial admin account creation with validation

#### Frontend & User Interface
- **Public Frontend** - Beautiful landing page with feature showcase
- **Analytics Dashboard** - Statistics and quick actions
- **Admin Console** - Full-featured content management interface with AdminLTE theme
- **Responsive Design** - Mobile-friendly layouts across all pages
- **Light Theme UI** - High-contrast, accessible color scheme

#### Technical Infrastructure
- **Next.js 16** - Latest stable version with Turbopack support
- **React 19** - Modern React with concurrent rendering
- **Tailwind CSS** - Utility-first CSS framework
- **Proxy API** - Request routing with authentication and security headers
- **Standalone Output** - Optimized for Docker and self-hosted deployments
- **Environment Configuration** - Flexible multi-environment support

#### Deployment & Hosting
- **Vercel Ready** - Optimized for serverless deployment
- **Docker Support** - Included Dockerfile and Docker Compose configuration
- **Self-Hosting** - Compatible with Node.js VPS and container platforms
- **Production Configuration** - next.config.ts optimized for performance and security

#### API Routes
- `GET /api/projects` - List all projects
- `GET /api/staff` - List team members
- `GET /api/pages` - List pages
- `GET /api/categories` - List categories
- Admin CRUD endpoints for all content types

#### Documentation
- **Comprehensive README** - Project overview and setup guide
- **Architecture Documentation** - System design and component relationships
- **Hosting Guide** - Deployment instructions for all platforms
- **Q&A and Production Checklist** - Pre-release quality verification

### 🔧 Configuration

- **next.config.ts** - Optimized configuration with:
  - Standalone output for Docker
  - Security headers
  - Image optimization with AVIF/WebP formats
  - Compression enabled
  - Rewrite rules for /admin and /api routing

- **proxy.ts** - Request routing with:
  - Session-based authentication
  - Password change enforcement
  - Security headers on all responses
  - Route protection and redirects

### 📋 Notes

This is a **Public Beta (Early Access)** release. While all core features are implemented and tested, some advanced features and integrations may still be refined based on feedback.

**Status:** 🟡 Beta - Not recommended for production use without additional testing

**Stability:** All core functionality tested; known limitations documented in RELEASE_NOTES.md

---

## Future Releases

### Planned for v1.0.0 (Stable)
- User authentication improvements
- Advanced permission management
- Webhooks and integrations
- Content versioning and publishing workflow
- Scheduled publishing
- Workflow approval chains
- Bulk import/export tools

### Planned for v1.1.0
- SEO optimization tools
- Multi-language support
- Advanced caching strategies
- Analytics integration
- Content preview URLs
- API rate limiting and quotas

---

## How to Report Issues

Found a bug? Please open an issue on [GitHub Issues](https://github.com/yourusername/micro-headless-cms/issues) with:
- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (Node.js version, OS, browser)
- Screenshots or error logs (if applicable)

---

## Version History

- **v1.0.0-beta.1** (April 11, 2026) - Initial Beta Release
