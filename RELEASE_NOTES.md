# Release Notes - v2.0.0-beta.2

**Release Date:** October 11, 2026

**Status:** 🟡 **BETA - EARLY ACCESS** (Not for Production)

---

## 🎉 Welcome to Micro Headless CMS Beta 2!

This is the **second public beta release** of Micro Headless CMS, a modern, API-first content management system built with Next.js 16.4.0, TypeScript, and PostgreSQL.

### ⚠️ Important Note

This is a **beta release** intended for early adopters and testers. While all core features are implemented and tested, we recommend:

- ✅ Use for **development and staging** environments
- ✅ Use for **feature testing and feedback**
- ⚠️ **Do not use in production** without additional testing
- ⚠️ **Database schema may change** in future releases
- ⚠️ **API endpoints may change** before v1.0.0 stable release

If you experience issues, please [report them on GitHub](https://github.com/Ex0-Adam/THOTH-V2/issues).

---

## 👨‍💼 About the Developer

**GitHub Developer Program Member** | **Google Workspace Reseller**

This project is created and maintained by a verified **GitHub Developer Program Member** with deep expertise in:

- ✅ Cloud infrastructure and DevOps
- ✅ Enterprise application architecture  
- ✅ Product scalability and performance
- ✅ API design and microservices patterns
- ✅ Open source software development

**Developer Credentials:**
- 🏆 **GitHub Developer Program Member** - Verified by GitHub
- 🏆 **Google Workspace Certified Reseller** - Authorized Google partner
- 🏆 **Google Cloud Platform** - Professional expertise
- 🏆 **Enterprise Open Source Contributor** - Published libraries and frameworks

Read more about the developer's background and projects in [README.md](./README.md#👨‍💼-about-the-developer).

---

## ✨ What's New in v2.0.0-beta.2

### 🔒 Security Hardening
- **Secret feature readiness check** — Non-fatal `GET /api/system/bootstrap` exposes `features.secrets`; admin database page shows Secret storage card with setup guidance
- **Login brute-force protection (Phase 1.4)** — Two-tier rate limit buckets (per IP + per account) with IP short-circuit, 429 + `Retry-After` headers, success resets account bucket
- **Upload content sniff (Phase 1.5)** — Magic bytes validation (JPEG `FFD8FF`, PNG `89504E47`, WebP `RIFF...WEBP`, GIF `GIF8`) must match declared MIME type; **SVG removed from allowlist** until sanitizer exists
- **Upload rate limiting** — In-memory fixed-window (default 30 req/min), hard-cap 10k buckets, env `UPLOAD_RATE_LIMIT_MAX`/`WINDOW_MS`
- **Cron fail-closed** — `AUTOMATION_CRON_SECRET` required, 401 when unset

### 🧪 Testing & Quality
- **151 automated tests** — `node --test tests/*.test.mjs` (14 files, 100% pass)
- **New test suites**: `secrets-crypto` (encrypt/decrypt round-trip, tamper detection), `automation-helpers` (slugify, stripHtml, computeNextDailyRun), `api-smoke` (opt-in HTTP 401 checks), `secret-readiness` (non-fatal feature flag), `upload-guard` (magic bytes ×10)
- **TypeScript strict** — `npx tsc --noEmit` ✅, ESLint 0 errors / 17 warnings
- **Engine constraint** — Node `>=20.9.0` (matches Next.js 16)

### 🏗️ Infrastructure & Database
- **Prisma Migrations baseline** — `prisma/migrations/20261010120000_init/` (12 tables, indexes, FKs) + `migration_lock.toml`
- **Docker entrypoint** → `npx prisma migrate deploy` (previously `db push`)
- **docker-compose.yml** — `POSTGRES_PASSWORD` required (no default), URL-safe generation via `openssl rand -hex 24`
- **CI lint gate** — Removed `continue-on-error: true` from release workflow
- **PRODUCT_CMS_SETUP.sql** regenerated from schema (12 tables, all indexes/FKs)

### 🧹 Code Hygiene
- **Dead code removed** — `frontend/` (1,877 LOC, 11 files), `/products` & `/dashboard` pages + product marketing copy from home page
- **Unused deps removed** — `admin-lte`, `bootstrap`, `jquery`, `popper.js`, `@uiw/react-markdown-preview`, `@uiw/react-md-editor`
- **Extensions** — Example `hello-module` scaffolded; hot-load runtime still pending
- **Documentation** — `SELF_HOSTING.md` + `UPGRADE_GUIDE.md` updated for `migrate deploy` + baseline resolve

### 🔧 Developer Experience
- **Release workflow** — GitHub Actions auto-triggers on version-bump commit to `main`, runs tests+lint+build, waits for Vercel preview, tags + prerelease
- **New test files**: `secrets-crypto.test.mjs`, `automation-helpers.test.mjs`, `api-smoke.test.mjs` (opt-in via `THOTH_HTTP_SMOKE=1`)
- **npm scripts**: `npm test` = 151 tests, `npm run lint` 0 errors

---

## 📋 What's Included in v2.0.0-beta.2 (Carried from beta.1)

### 🚀 Core Features
- **Headless CMS Platform** — REST API for all content types
- **Content Modules** — Projects, Staff, Pages, Categories
- **Media Management** — Asset library with S3 and local storage
- **Navigation Builder** — Dynamic menu creation
- **Admin Console** — Professional-grade content editor (15 pages)
- **AI Automation** — Campaign scheduling with Google AI integration

### 🌐 Frontend & Public Pages
- **Landing Page** — Beautiful homepage with feature showcase
- **Analytics Dashboard** — Statistics and quick actions
- **Responsive Design** — Mobile-friendly on all devices
- **Light Theme** — High-contrast, accessible UI

### 🛠 Technical Stack
- **Next.js 16.4.0** — Latest stable with Turbopack support
- **React 19.2.4** — Modern concurrent rendering
- **TypeScript** — Type-safe codebase
- **PostgreSQL + Prisma 6.19.x** — Robust database management
- **Tailwind CSS 4** — Modern utility-first styling
- **bcryptjs** — Secure password hashing

### 🚢 Deployment Ready
- **Vercel** — Zero-config serverless deployment (auto-preview on release workflow)
- **Docker** — Included Dockerfile and docker-compose (`output: "standalone"`)
- **Self-Hosting** — VPS, DigitalOcean, Linode, AWS, Google Cloud, Azure
- **Production Configuration** — Security headers, optimization, caching

---

## 📋 System Requirements

### Minimum Requirements
- **Node.js** - 20.9.0 or higher
- **Database** - PostgreSQL 12+ (or PostgreSQL-compatible like Neon, Supabase)
- **npm** - 10.x or higher

### Recommended Requirements
- **Node.js** - 20 LTS or 22 LTS
- **PostgreSQL** - Latest stable version
- **npm** - Latest version

### Browser Support
- Chrome/Edge (Latest 2 versions)
- Firefox (Latest 2 versions)
- Safari (Latest 2 versions)
- Mobile: iOS Safari 14+, Chrome Mobile

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Ex0-Adam/THOTH-V2.git
cd THOTH-V2

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Setup database (fresh DB)
npx prisma migrate deploy
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. Navigate to [http://localhost:3000/setup](http://localhost:3000/setup)
2. Create your initial admin account
3. Log in at [http://localhost:3000/login](http://localhost:3000/login)
4. Access admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin)

### Existing DB Migration (from `db push`)

```bash
# One-time baseline resolve for DBs previously provisioned via db push
npx prisma migrate resolve --applied 20261010120000_init
npx prisma migrate deploy
```

---

## 🐛 Known Limitations & Issues

### Beta Limitations
- ⚠️ **API documentation** — Swagger/OpenAPI docs coming in v1.0.0
- ⚠️ **Permission system** — Role-based permissions in development (Core 9.1)
- ⚠️ **Webhooks** — Planned for v1.0.0 (Core 8.3)
- ⚠️ **Content versioning** — Not yet implemented (Core 9.2)
- ⚠️ **Multi-language support** — Planned for v1.1.0
- ⚠️ **Scheduled publishing** — Coming in v1.0.0
- ⚠️ **Database backup/restore** — Manual process required
- ⚠️ **E2E Playwright tests** — Not yet implemented (deferred to post-beta)

### Testing Status

**✅ Tested Components:**
- Admin login and session management (signed cookies, HMAC-SHA256)
- Content CRUD operations (Create, Read, Update, Delete)
- REST API endpoints for all content types (30 routes)
- Database migrations and schema updates (baseline + deploy)
- Docker containerization
- Basic security headers and route protection
- XSS sanitization (sanitize-html allowlist + normalizeUrl)
- Upload magic bytes validation + rate limiting
- Login brute-force protection (2-tier buckets)

**🟡 Partially Tested:**
- Large-scale data handling (500K+ records)
- Extended concurrent user load testing
- All edge cases in complex workflows

**❌ Not Yet Tested:**
- Some advanced permission scenarios (RBAC pending Core 9.1)
- End-to-end integration tests (Playwright deferred)
- Load testing at scale (10K+ concurrent users)
- All deployment platform variations

---

## 📊 Hosting Compatibility

### ✅ Fully Supported
- **Vercel** — Recommended, zero-config, best performance (auto-preview on release)
- **Netlify** — Full Next.js 16 support
- **Docker** — Self-hosted in any container platform

### ✅ Supported with Configuration
- **VPS/Self-Hosting** — Hostinger, DigitalOcean, Linode, AWS, Google Cloud, Azure
- **Kubernetes** — Via Docker image
- **Process Managers** — PM2, systemd

### ❌ Not Supported
- **Shared PHP Hosting** — cPanel, Bluehost, GoDaddy shared hosting
- **Node.js <20.9.0** — Older versions not supported

---

## 🔄 Upgrading from v2.0.0-beta.1

### Breaking Changes
- **Database** — Now uses Prisma Migrations (`prisma migrate deploy`) instead of `db push`. Existing DBs need one-time `prisma migrate resolve --applied 20261010120000_init`
- **Docker** — Entrypoint changed to `prisma migrate deploy`; `POSTGRES_PASSWORD` now required in docker-compose
- **Node.js** — Minimum version now `>=20.9.0` (was `>=20`)
- **Removed** — `frontend/` dead code, `/products` and `/dashboard` public pages, 6 unused npm dependencies

### Database
- Fresh install: `npx prisma migrate deploy` (applies baseline migration)
- Existing `db push` DBs: Run `prisma migrate resolve --applied 20261010120000_init` once, then `migrate deploy`

---

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and setup
- **[CHANGELOG.md](./CHANGELOG.md)** - Full version history
- **[MANUAL.md](./MANUAL.md)** - Detailed tutorials and guides
- **[UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md)** - Version upgrade instructions
- **[FRONTEND_STANDARD.md](./FRONTEND_STANDARD.md)** - Frontend development standards
- **[docs/SELF_HOSTING.md](./docs/SELF_HOSTING.md)** - Self-hosting guide
- **[docs/UPDATE_PLAN_2026-10.md](./docs/UPDATE_PLAN_2026-10.md)** - Phase 1-7 completion status

---

## 📦 Downloads & Installation

### Latest Release
**v2.0.0-beta.2** - [Download on GitHub](https://github.com/Ex0-Adam/THOTH-V2/releases/tag/v2.0.0-beta.2)

### Install from Source
```bash
git clone https://github.com/Ex0-Adam/THOTH-V2.git
cd THOTH-V2
git checkout v2.0.0-beta.2
npm install
```

### With Docker
```bash
docker pull yourusername/micro-headless-cms:2.0.0-beta.2
docker run -e DATABASE_URL=postgresql://... yourusername/micro-headless-cms:2.0.0-beta.2
```

---

## 🐛 Reporting Issues

Found a bug or have feedback? Please help us improve!

### How to Report

1. Check [existing issues](https://github.com/Ex0-Adam/THOTH-V2/issues) first
2. Open a [new issue](https://github.com/Ex0-Adam/THOTH-V2/issues/new) with:
   - **Title**: Clear, concise description
   - **Description**: What happened vs. expected behavior
   - **Steps to Reproduce**: Exact steps to trigger the issue
   - **Environment**: Node.js version, OS, browser
   - **Screenshots**: If applicable
   - **Error Logs**: Full error messages

### Priority

- **CRITICAL** 🔴 - System down, data loss, security vulnerability
- **HIGH** 🟠 - Major feature broken, workaround possible
- **MEDIUM** 🟡 - Minor feature issue, UI problem
- **LOW** 🟢 - Enhancement, documentation, nice-to-have

---

## 🎯 What's Coming Next

### v2.0.0-beta.3 (Next Beta)
- Secret feature startup fail-fast (when SecretStore becomes mandatory)
- E2E Playwright smoke tests
- RBAC foundation (Core 9.1)

### v2.0.0-rc.1 (Release Candidate)
- Webhooks (Core 8.3)
- RBAC complete (Core 9.1)
- Revision history (Core 9.2)
- All security gates passing
- E2E tests passing

### v2.0.0 (Stable)
- Production-ready with full security audit
- Complete documentation
- Migration guides from v1.x

---

## 🙏 Thank You

Thank you for being an early adopter! Your feedback is invaluable in helping us build a better product.

- **Feedback**: Open an issue or discussion on GitHub
- **Questions**: Check [README.md](./README.md) documentation
- **Contribute**: Code contributions welcome! (See CONTRIBUTING.md)

**Happy building! 🚀**

---

## 📄 Release Information

- **Version**: 2.0.0-beta.2
- **Release Date**: October 11, 2026
- **Status**: Beta (Early Access)
- **Support**: GitHub Issues only
- **License**: Check LICENSE.md file

Made with ❤️ by a **GitHub Developer Program Member** & **Google Workspace Reseller**