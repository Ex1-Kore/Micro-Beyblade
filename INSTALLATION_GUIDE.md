# Micro Headless CMS - Installation Manual

**Version**: v2.0.0-beta.1  
**Last Updated**: October 2026  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Requirements](#system-requirements)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Local Development (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/WebShardow/Micro-Headless-CMS-Product.git
cd Micro-Headless-CMS-Product

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your database URL

# 4. Initialize database
npx prisma migrate dev

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

---

## System Requirements

### Development
- Node.js 20+ (22.x LTS recommended)
- npm 9+ or yarn 3+ or pnpm 8+
- PostgreSQL 14+ (local or remote)
- 2GB RAM minimum
- macOS, Linux, or Windows 11

### Production
- Node.js 20+ (LTS)
- PostgreSQL 14+ (managed or self-hosted)
- 4GB+ RAM
- Reverse proxy (Nginx, Caddy, or managed by hosting)
- TLS/SSL certificate

### Database Services (Recommended for Cloud)
- **Vercel Postgres**: Free tier included with Vercel
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Managed PostgreSQL
- **Azure Database**: Microsoft managed
- **DigitalOcean**: Affordable managed PostgreSQL

### Hosting Platforms
- **Vercel** (★ Recommended) - Optimized for Next.js
- **Netlify** - Good alternative with serverless
- **AWS** - ECS, Lambda, EC2
- **DigitalOcean** - AppPlatform, Droplets
- **VPS/Dedicated** - Any Linux server with Node.js

---

## Installation Methods

### Method 1: Local Development

#### Prerequisites
```bash
# Check versions
node --version    # Must be 20.0.0+
npm --version     # Must be 9.0.0+
which psql        # PostgreSQL client CLI
```

#### Step-by-Step

**1. Clone Repository**
```bash
git clone https://github.com/WebShardow/Micro-Headless-CMS-Product.git
cd Micro-Headless-CMS-Product
```

**2. Create Local Database**
```bash
# Create PostgreSQL database
createdb cms_development

# Or with psql:
psql -U postgres -c "CREATE DATABASE cms_development;"
```

**3. Environment Configuration**
Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_development"

# Environment
NODE_ENV=development
PORT=3000

# Security (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-random-secret-key-32-chars

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Optional: Authentication providers
GITHUB_ID=your-github-oauth-id
GITHUB_SECRET=your-github-oauth-secret
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

**4. Install Dependencies**
```bash
npm install
# or: yarn install / pnpm install
```

**5. Setup Database**
```bash
# Run migrations
npx prisma migrate dev --name init

# View database in GUI
npx prisma studio
# Opens http://localhost:5555
```

**6. Launch Development Server**
```bash
npm run dev
# Starts at http://localhost:3000
```

**7. Access Admin Panel**
- Go to: http://localhost:3000/admin
- First visit: http://localhost:3000/setup (initialize admin)
- Create your admin user and password

---

### Method 2: Docker (Recommended for Production)

#### Prerequisites
```bash
# Check installations
docker --version      # Must be 20.10+
docker-compose --version  # Must be 2.0+
```

#### Setup Steps

**1. Clone & Navigate**
```bash
git clone https://github.com/WebShardow/Micro-Headless-CMS-Product.git
cd Micro-Headless-CMS-Product
```

**2. Create `.env.local`**
```env
# Docker-based environment
DATABASE_URL="postgresql://cms_user:cms_secure_password@postgres:5432/cms_production"
NODE_ENV=production
JWT_SECRET=your-32-character-random-secret-key
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**3. (Optional) Customize docker-compose.yml**
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://cms_user:cms_password@postgres:5432/cms_db
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: cms_user
      POSTGRES_PASSWORD: cms_password
      POSTGRES_DB: cms_db
    restart: unless-stopped

volumes:
  postgres_data:
```

**4. Start Services**
```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down

# Backup database
docker-compose exec postgres pg_dump -U cms_user cms_db > backup.sql
```

#### Database in Docker
- Connection inside Docker: `http://postgres:5432`
- Connection from host: `http://localhost:5432` (if exposed)

---

### Method 3: Vercel Deployment (★ Recommended)

Vercel is optimized for Next.js and includes PostgreSQL.

#### Step 1: Connect Repository
```bash
# Option A: Via Git
# Push to GitHub, connect to Vercel dashboard

# Option B: Via CLI
npm i -g vercel
vercel login
vercel
```

#### Step 2: Add Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL = postgresql://...
JWT_SECRET = your-secret-key
NEXT_PUBLIC_API_URL = https://yourdomain.vercel.app/api
NODE_ENV = production
```

#### Step 3: Deploy
```bash
vercel --prod

# Or automatic via Git push to main branch
```

#### Using Vercel Postgres (Recommended)
```bash
# Install Vercel PostgreSQL
vercel postgres create

# Get connection string
vercel env pull  # Creates .env.local

# Add to DATABASE_URL
```

---

### Method 4: Traditional VPS/Self-Hosted

#### Server Setup (Ubuntu 22.04)

**1. SSH into Server**
```bash
ssh root@your-vps-ip
```

**2. Update System**
```bash
apt update && apt upgrade -y
```

**3. Install Node.js**
```bash
# NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs

# Verify
node --version  # Should be 22.x
npm --version
```

**4. Install PostgreSQL**
```bash
apt install -y postgresql postgresql-contrib

# Enable and start
systemctl enable postgresql
systemctl start postgresql

# Create database
sudo -u postgres createdb cms_production
sudo -u postgres createuser cms_user -P
```

**5. Setup Application**
```bash
# Create app directory
mkdir /app/cms
cd /app/cms

# Clone repository
git clone https://github.com/WebShardow/Micro-Headless-CMS-Product.git .

# Install dependencies
npm ci --omit=dev

# Create environment file
nano .env.local
```

**.env.local content:**
```env
DATABASE_URL="postgresql://cms_user:password@localhost:5432/cms_production"
NODE_ENV=production
JWT_SECRET=your-secret-key
PORT=3000
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

**6. Build Application**
```bash
npm run build
```

**7. Install & Configure PM2**
```bash
npm install -g pm2

# Start application
pm2 start npm --name "cms" -- start
pm2 save
pm2 startup

# View status
pm2 status
```

**8. Configure Nginx**
```bash
apt install -y nginx

# Create config
nano /etc/nginx/sites-available/cms
```

**Nginx Configuration:**
```nginx
upstream cms {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://cms;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable Nginx Site**
```bash
ln -s /etc/nginx/sites-available/cms /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**9. Setup SSL with Certbot**
```bash
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | ✅ Yes | Environment | `production` or `development` |
| `JWT_SECRET` | ✅ Yes | Session secret (32+ chars) | `random-hex-string` |
| `PORT` | ❌ No | Server port | `3000` |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | API endpoint (public) | `https://api.example.com` |
| `GITHUB_ID` | ❌ OAuth | GitHub client ID | `xxx` |
| `GITHUB_SECRET` | ❌ OAuth | GitHub client secret | `xxx` |
| `GOOGLE_CLIENT_ID` | ❌ OAuth | Google OAuth ID | `xxx` |
| `GOOGLE_CLIENT_SECRET` | ❌ OAuth | Google OAuth secret | `xxx` |

### Generate Secure JWT_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Database Connection Strings

```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_db"

# Vercel Postgres
DATABASE_URL="postgresql://user:password@your-db.vercel.com:5432/verceldb"

# Neon (Serverless)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.sql.neon.tech/dbname?sslmode=require"

# AWS RDS
DATABASE_URL="postgresql://admin:password@cms-prod.xxxxx.us-east-1.rds.amazonaws.com:5432/cms_db"

# With Connection Pooling
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&statement_cache_size=0"
```

---

## Deployment

### Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] npm run build succeeds
- [ ] npm test passes (if tests exist)
- [ ] .env.local added to .gitignore
- [ ] HTTPS/TLS certificate configured
- [ ] Backups enabled
- [ ] Monitoring/logging configured

### Performance Optimization

```bash
# Production build
npm run build

# Check performance
npm run analyze  # Requires @next/bundle-analyzer

# Database indexes
npx prisma db execute --stdin < scripts/optimize-db.sql
```

### Monitoring

```bash
# View logs
pm2 logs cms  # For PM2 deployments
docker-compose logs -f web  # For Docker

# Database monitoring
npx prisma studio
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fixes**:
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Fix**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### 3. Out of Memory
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```
**Fix**:
```bash
# Increase memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### 4. Prisma Migration Issues
```bash
# Reset (careful - loses data!)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name fix_issues

# Deploy migrations
npx prisma migrate deploy
```

#### 5. CORS Errors
Ensure `NEXT_PUBLIC_API_URL` matches your domain:
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Getting Help

- **Issues**: https://github.com/WebShardow/Micro-Headless-CMS-Product/issues
- **Discussions**: https://github.com/WebShardow/Micro-Headless-CMS-Product/discussions
- **Email**: grids@microtronic.biz
- **Phone**: 06-5541-9166
- **LINE**: @teu8808s

---

## Support

| Support Level | Response Time | Features |
|--------------|--------------|----------|
| Free | Community | Forum support, documentation |
| Starter ($19/mo) | 24 hours | Email support |
| Professional ($59/mo) | 4 hours | Priority email, Slack, advanced features |
| Enterprise | 1 hour | 24/7 phone, dedicated manager |

---

## License

See LICENSE file for details.

**Last Updated**: October 2026  
**Version**: v2.0.0-beta.1
