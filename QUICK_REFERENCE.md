# Quick Reference Guide

**Micro Headless CMS - Common Commands & Operations**

---

## 🚀 Getting Started

### First Time Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

---

## 👨‍💻 Development Commands

### Running the Server
```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Both build and start
npm run build && npm run start
```

### Code Quality
```bash
# Check TypeScript
npm run type-check

# Run ESLint
npm run lint

# Run all checks
npm run build && npm run type-check && npm run lint
```

---

## 📁 Project Structure Quick View

```
Micro-Headless-CMS-Product/
├── app/                    # Next.js pages & routes
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout with metadata
│   ├── /products          # Products page
│   └── /dashboard         # Dashboard page
│
├── components/            # Reusable React components
│   ├── Header.tsx         # Navigation with credentials
│   ├── ErrorBoundary.tsx  # Error handling wrapper
│   ├── EmptyState.tsx     # Empty state UI
│   └── ProductCard.tsx    # Product card display
│
├── lib/                   # Utility functions & libraries
│   └── api.ts            # API client with error handling
│
├── frontend/              # Frontend-specific assets
│   ├── /styles           # CSS files
│   └── /components       # Frontend layout components
│
├── public/                # Static files
│   ├── logo.svg
│   └── og-image.png      # OpenGraph image
│
├── prisma/                # Database
│   └── schema.prisma
│
└── Configuration Files
    ├── next.config.ts     # Next.js config
    ├── middleware.ts      # Security & routing
    ├── tsconfig.json
    ├── postcss.config.mjs
    ├── vercel.json        # Deployment config
    └── .env.example
```

---

## 🛠️ Environment Setup

### Create Environment File
```bash
# Development
cp .env.example .env.local

# Production (NEVER commit this)
cp .env.example .env.production.local
```

### Required Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
NEXT_PUBLIC_MARKETPLACE_URL="https://micro-marketplace-iota.vercel.app"

# Security
SESSION_SECRET="generate-random-strong-secret-here"

# Extensions
EXTENSIONS_DIR="extensions"
EXTENSIONS_WRITE_ENABLED="false"
```

### Generate Secure Secret
```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🗄️ Database Operations

### Create Database Connection
```bash
# Using psql (PostgreSQL CLI)
psql -h localhost -U postgres -d micro_cms

# Or use connection string
psql postgresql://user:password@localhost:5432/database?schema=public
```

### Prisma Commands
```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio

# Seed database (if seeders exist)
npx prisma db seed
```

---

## 🧪 Testing

### Manual Testing
```bash
# Test API endpoint
curl http://localhost:3000/api/projects

# Using VS Code REST Client
# Create test.rest file and use "Send Request"
GET http://localhost:3000/api/projects
```

### Build Test
```bash
# Test production build locally
npm run build
npm run start
# Visit http://localhost:3000
```

---

## 📦 Deployment

### Local Pre-Deployment Check
```bash
# Step 1: Build
npm run build

# Step 2: Check types
npm run type-check

# Step 3: Lint
npm run lint

# All at once
npm run build && npm run type-check && npm run lint
```

### Push to GitHub
```bash
# Check git status
git status

# Add changes
git add .

# Commit
git commit -m "Production: finalize Micro Headless CMS"

# Push
git push origin main
```

### Deploy to Vercel
```bash
# Option 1: Via CLI
npm install -g vercel
vercel

# Option 2: Via Dashboard
# 1. Go to vercel.com/dashboard
# 2. Click "Add New" → "Project"
# 3. Import GitHub repository
# 4. Add environment variables
# 5. Click Deploy
```

### After Vercel Deployment
```bash
# Verify deployment
curl -I https://your-domain.vercel.app

# Test API
curl https://your-domain.vercel.app/api/projects

# Check status
vercel status
```

---

## 🐛 Debugging

### Enable Debug Logging
```bash
# Development with more logs
DEBUG=* npm run dev

# Or set in .env.local
LOG_LEVEL=debug
```

### View Build Output
```bash
# Verbose build
npm run build -- --debug

# Check build size
npm run build -- --profile
```

### Database Debugging
```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# View logs
npx prisma db execute --stdin < query.sql
```

### Check Environment Variables
```bash
# List all loaded variables
env | grep NEXT_PUBLIC
env | grep DATABASE

# In Node.js
console.log(process.env.DATABASE_URL)
```

---

## 🔍 Common Issues & Solutions

### "Cannot find module" Error
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Error
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify database exists
psql $DATABASE_URL -c "\l"
```

### Port 3000 Already in Use
```bash
# Solution: Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Check all types
npm run type-check

# Fix common issues
npm run lint -- --fix
```

### Build Fails on Vercel
```bash
# Check build logs
vercel logs --tail

# Redeploy with full build
vercel redeploy --prod

# Check environment
vercel env list
```

---

## 📚 Useful Commands Summary

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run type-check` | Check TypeScript |
| `npm run lint` | Run ESLint |
| `npm run lint -- --fix` | Auto-fix lint issues |
| `npx prisma studio` | Open database browser |
| `npx prisma migrate dev` | Run database migrations |
| `npm install` | Install dependencies |
| `npm update` | Update packages |
| `git status` | Check git status |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit changes |
| `git push origin main` | Push to GitHub |

---

## 🔗 Useful Links

### Documentation
- **README.md** - Project overview and credentials
- **FRONTEND_STANDARD.md** - Architecture standards
- **DEPLOYMENT.md** - Vercel deployment guide
- **ENV_SETUP.md** - Environment configuration guide

### External Resources
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Prisma**: https://www.prisma.io/docs/
- **Vercel Docs**: https://vercel.com/docs

### GitHub
- **GitHub Developer Program**: https://github.com/developers
- **Google Workspace**: https://workspace.google.com/

---

## ⚡ Pro Tips

### 1. Use VS Code Extensions
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prisma**
- **REST Client** (for API testing)

### 2. Keyboard Shortcuts
```
Cmd/Ctrl + Shift + P    # Command Palette
Cmd/Ctrl + J            # Toggle Terminal
Cmd/Ctrl + /            # Toggle Comment
Cmd/Ctrl + F            # Find
Cmd/Ctrl + H            # Find & Replace
Alt + Arrow Up/Down     # Move Line
Cmd/Ctrl + D            # Select Word
```

### 3. Git Workflow
```bash
# Feature branch
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add feature"
git push origin feature/my-feature
# Create PR on GitHub

# After merge
git checkout main
git pull origin main
git branch -d feature/my-feature
```

### 4. Performance Optimization
- Use `next/image` for images
- Enable image compression in next.config.ts
- Use lazy loading for components
- Check Vercel Analytics periodically
- Monitor database query logs

### 5. Security Best Practices
- Never commit `.env.local` files
- Rotate secrets regularly
- Use strong passwords (32+ chars)
- Keep dependencies updated
- Review security headers in middleware.ts

---

## 📞 Support

**For issues or questions:**
1. Check documentation files (README.md, DEPLOYMENT.md, ENV_SETUP.md)
2. Check ESLint/TypeScript errors: `npm run lint`, `npx tsc --noEmit`
3. Run tests: `npm test`
4. Review Vercel logs: `vercel logs --tail`
5. Check GitHub Issues in repository

---

**Last Updated:** 2026-10-09 (เอกสารเก่าถูกลบออกแล้ว — เนื้อหาส่วน command ยังใช้ได้)
**Status:** อ้างอิง `AGENTS.md` สำหรับสถานะจริงของโปรเจกต์
