# Environment Sync & Setup Verification

**Complete Environment Configuration for Micro Headless CMS**

---

## 🔍 Configuration Files Checklist

### Frontend Configuration
- ✅ `next.config.ts` - Next.js configuration with Vercel optimization
- ✅ `.vercelignore` - Vercel build optimization
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `middleware.ts` - Route protection & security headers
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `postcss.config.mjs` - Tailwind CSS PostCSS setup
- ✅ `eslint.config.mjs` - ESLint configuration

### Environment Templates
- ✅ `.env.example` - Documented environment variables
- ⚠️ `.env.local` - Not in repository (CREATE MANUALLY)
- ⚠️ `.env.production.local` - Not in repository (CREATE FOR PRODUCTION)

### Documentation
- ✅ `README.md` - Professional project README
- ✅ `FRONTEND_STANDARD.md` - Frontend architecture standards
- ✅ `DEPLOYMENT.md` - Vercel deployment guide
- ✅ `MANUAL.md` - Backend manual (if exists)

---

## 📋 Environment Variables Setup

### 1. Local Development Setup

**Create `.env.local` file at project root:**

```bash
# Copy from template
cp .env.example .env.local

# Edit with your local configuration
nano .env.local  # or use VS Code
```

**Required Variables for Development:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/micro_cms?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
SESSION_SECRET="development-secret-key-minimum-32-chars-long"
EXTENSIONS_DIR="extensions"
EXTENSIONS_WRITE_ENABLED="false"
```

### 2. Production Setup

**Create `.env.production.local` file (NEVER commit to git):**

```bash
# DO NOT commit this file
echo ".env.production.local" >> .gitignore

# Create with strong secrets
cat > .env.production.local << EOF
DATABASE_URL="postgresql://user:strong-password@prod-db.example.com:5432/micro_cms?schema=public"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_BACKEND_URL="https://your-domain.vercel.app"
SESSION_SECRET="$(openssl rand -hex 32)"
EXTENSIONS_DIR="extensions"
EXTENSIONS_WRITE_ENABLED="false"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
EOF
```

### 3. Vercel Environment Variables

**Set via Vercel Dashboard:**

Navigate to: **Settings** → **Environment Variables**

| Variable | Scope | Value |
|----------|-------|-------|
| `DATABASE_URL` | Production | PostgreSQL connection URL |
| `NEXT_PUBLIC_APP_URL` | Production | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_BACKEND_URL` | Production | `https://your-domain.vercel.app` |
| `SESSION_SECRET` | Production | Strong random string (32+ chars) |

**Mark as secret:** Check ✓ for DATABASE_URL, SESSION_SECRET, AWS keys

---

## 🔐 Security Checklist

### Before Pushing to Repository
- [ ] NO `.env.local` in git (check `.gitignore`)
- [ ] NO `.env.production.local` in git
- [ ] NO API keys in code
- [ ] NO database credentials in commits
- [ ] `.gitignore` includes all secret files

### Before Deploying to Production
- [ ] All environment variables configured in Vercel
- [ ] SESSION_SECRET is strong (32+ chars, random)
- [ ] Database URL uses strong password
- [ ] AWS keys (if used) are rotated
- [ ] SSL/HTTPS is enforced
- [ ] Security headers are enabled (middleware.ts)

### Generating Secure Secrets

**Option 1: Using OpenSSL (Windows/Linux/Mac)**
```bash
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Using Python**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## ✅ Configuration Validation

### Step 1: Verify File Structure
```bash
# Check critical files exist
ls -la next.config.ts middleware.ts vercel.json .env.example
```

**Expected Output:**
```
-rw-r--r--  next.config.ts
-rw-r--r--  middleware.ts
-rw-r--r--  vercel.json
-rw-r--r--  .env.example
```

### Step 2: Verify Environment Variables
```bash
# Load .env.local in current shell
export $(cat .env.local | xargs)

# Verify critical variables
echo $DATABASE_URL
echo $NEXT_PUBLIC_APP_URL
echo $SESSION_SECRET
```

### Step 3: Verify Dependencies
```bash
# Check package.json has all required packages
grep -E "next|react|typescript|tailwindcss|prisma" package.json
```

**Expected:**
- ✅ `next@16.2.0` or newer
- ✅ `react@19.2.4` or newer
- ✅ `typescript@5`
- ✅ `tailwindcss@4`

### Step 4: Build Validation
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Run ESLint
npm run lint
```

### Step 5: Runtime Validation
```bash
# Start development server
npm run dev

# Open http://localhost:3000 in browser

# Verify:
# ✅ Homepage loads
# ✅ Header displays credentials badges
# ✅ Navigation works
# ✅ Products page loads
# ✅ Dashboard accessible
```

---

## 📂 Frontend Structure Verification

### Required Directories
```
Micro-Headless-CMS-Product/
├── /app                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page
│   ├── /products          # Products page
│   └── /dashboard         # Dashboard page
│
├── /components            # Reusable React components
│   ├── Header.tsx         # With credentials badges
│   ├── CredentialsBadge.tsx
│   ├── ErrorBoundary.tsx  # Error handling
│   ├── EmptyState.tsx     # Empty state UI
│   └── ProductCard.tsx    # Product card display
│
├── /lib                   # Utility libraries
│   └── api.ts            # Centralized API client
│
├── /frontend              # Frontend-specific code
│   ├── /app              # (frontend duplicate)
│   ├── /components       # (frontend duplicate)
│   └── /styles           # Global styles
│
├── /public                # Static assets
│   ├── logo.svg
│   ├── og-image.png      # OpenGraph image
│   └── favicon.ico
│
├── /prisma                # Database schema
│   └── schema.prisma
│
└── Configuration files:
    ├── next.config.ts     # Next.js config (Vercel optimized)
    ├── middleware.ts      # Route protection & security
    ├── tsconfig.json
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    ├── vercel.json        # Vercel deployment config
    ├── .vercelignore      # Vercel build optimization
    ├── .env.example       # Environment template
    ├── .gitignore
    └── package.json
```

### Verification Command
```bash
# List all critical files
ls -la \
  app/layout.tsx \
  app/page.tsx \
  app/products/page.tsx \
  components/Header.tsx \
  lib/api.ts \
  middleware.ts \
  next.config.ts \
  vercel.json \
  .env.example
```

---

## 🔄 Sync with Backend

### Backend API Endpoints

**Expected to be available at: `/api/projects`**

```typescript
// Frontend expects:
GET /api/projects
Response: Project[]

GET /api/staff
Response: StaffMember[]

GET /api/site-config
Response: SiteConfig

GET /api/pages
Response: Page[]

GET /api/categories
Response: Category[]
```

### Response Format Validation

**Open `/frontend/lib/api.ts` and verify:**
1. ✅ `Projects.getAll()` calls `/api/projects`
2. ✅ `Staff.getAll()` calls `/api/staff`
3. ✅ `SiteConfig.get()` calls `/api/site-config`
4. ✅ All methods handle errors gracefully (return null/[])
5. ✅ Type definitions match backend response

### Test API Connection
```bash
# Start dev server
npm run dev

# In another terminal, test API
curl http://localhost:3000/api/projects

# Or use VS Code REST Client
# Create test.rest file:
GET http://localhost:3000/api/projects
```

---

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] `npm run build` succeeds
- [ ] `npm run lint` shows no errors
- [ ] `npm run type-check` all green
- [ ] All TODO comments removed
- [ ] No console.log in production code

### Frontend Testing
- [ ] Homepage loads and displays correctly
- [ ] Header shows credentials badges
- [ ] Products page loads data
- [ ] Dashboard shows stats
- [ ] Error boundaries work (intentionally break something)
- [ ] Empty states display properly

### Security Review
- [ ] No secrets in code
- [ ] `.env.local` is in `.gitignore`
- [ ] All API keys in environment variables
- [ ] Middleware security headers enabled
- [ ] Database URL doesn't include password in code

### Git Status
```bash
# Verify .env files are ignored
git status | grep -E "\.env"
# Should show: nothing

# Check what's about to be committed
git diff --cached

# Push to repository
git push origin main
```

### Vercel Deployment
- [ ] Repository connected to Vercel
- [ ] Environment variables added
- [ ] Domain configured
- [ ] SSL certificate generated
- [ ] Redeploy triggered

---

## 🧪 Post-Deployment Testing

### Health Checks
```bash
# Test production endpoint
curl -I https://your-domain.vercel.app

# Verify API is accessible
curl https://your-domain.vercel.app/api/projects

# Check middleware security headers
curl -I https://your-domain.vercel.app/dashboard
# Should include: X-Content-Type-Options: nosniff
```

### Functionality Tests
- [ ] Visit homepage (verify metadata in page source)
- [ ] Check header for credentials badges
- [ ] Navigate to Products (should show data)
- [ ] Navigate to Dashboard (should load)
- [ ] Attempt to access /admin (should redirect if no auth)

### Performance Tests
- [ ] Check Vercel Analytics
- [ ] Monitor Core Web Vitals
- [ ] Download performance report
- [ ] Review database query logs

---

## 📞 Environment Issues & Solutions

### Issue: Build Fails with "Cannot find module"
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Database Connection Error
**Solution:**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if database exists
psql $DATABASE_URL -c "\l"
```

### Issue: Environment Variables Not Applied
**Solution:**
```bash
# Reload environment in current shell
unset $(grep -o "^[A-Z_]*" .env.local)
export $(cat .env.local | xargs)

# Verify
echo $DATABASE_URL
```

### Issue: Vercel Redeploy Not Using New Environment Variables
**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all variables are there
3. Go to Deployments → Click latest → "Redeploy" → "Redeploy Production"
4. Wait 2-3 minutes for redeploy to complete

---

## ✨ Final Verification

After everything is set up, run:

```bash
# All checks in sequence
echo "1. Building..." && npm run build && \
echo "2. Type checking..." && npm run type-check && \
echo "3. Linting..." && npm run lint && \
echo "4. ✅ All checks passed!"
```

If all succeed, you're ready for deployment! 🎉

---

**Last Updated:** 2025-01-FIN
**Status:** ✅ Production Ready
