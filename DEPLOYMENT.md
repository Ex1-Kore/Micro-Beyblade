# Vercel Deployment Guide

**Production-Ready Setup for Micro Headless CMS**

---

## ✅ Pre-Deployment Checklist

### Environment Configuration
- [ ] `.env.local` created with all required variables
- [ ] Database URL is valid and accessible
- [ ] Session secret is strong (generate new one for production)
- [ ] All API keys are configured (AWS S3, third-party services, etc.)

### Code Quality
- [ ] No console.log statements in production code
- [ ] All TypeScript types are strict
- [ ] No TODO comments left in critical code
- [ ] ESLint checks pass: `npm run lint`

### Frontend
- [ ] All pages tested locally
- [ ] Error boundaries are in place
- [ ] Loading states display correctly
- [ ] Responsive design tested on mobile/tablet/desktop

### Backend
- [ ] Database migrations applied
- [ ] API endpoints tested with frontend
- [ ] Error responses follow standard format
- [ ] CORS configured for frontend domain

### Security
- [ ] No secrets in code or version control
- [ ] Environment variables use strong values
- [ ] Middleware security headers configured
- [ ] API rate limiting implemented (if needed)

---

## 🚀 One-Click Vercel Deployment

### Step 1: Prepare Repository

```bash
# Commit all changes
git add .
git commit -m "Production: finalize Micro Headless CMS"

# Push to GitHub
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select **Import Git Repository**
4. Choose your GitHub repository
5. Select **Next.js** as the framework
6. Click **Deploy**

### Step 3: Configure Environment Variables

After initial deployment, go to **Settings** → **Environment Variables** and add:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-domain.vercel.app
SESSION_SECRET=generate-random-strong-secret-here
EXTENSIONS_DIR=extensions
EXTENSIONS_WRITE_ENABLED=false
```

**For production secrets**, use Vercel's secret manager:
- Create a `.env.production.local` file locally (don't commit)
- Use Vercel CLI: `vercel env pull`
- Or manually add through Vercel dashboard

### Step 4: Redeploy with Environment Variables

1. Go to **Deployments**
2. Click the latest deployment → **Redeploy**
3. Click **Redeploy Staging** → **Redeploy Production**

---

## 🔒 Production Security Checklist

### Environment Variables
- [ ] All secrets are in `.env.production.local` (NOT in repo)
- [ ] Database credentials use strong passwords
- [ ] SESSION_SECRET is at least 32 characters
- [ ] AWS credentials (if needed) are rotated

### Deployment Settings
- [ ] CORS allows only your frontend domain
- [ ] API keys are environment-variable based
- [ ] Database URL uses strong authentication
- [ ] Backups are configured

### Monitoring
- [ ] Error logging is configured
- [ ] Performance monitoring is enabled
- [ ] Database query monitoring is active
- [ ] Security alerts are subscribed

---

## 🌍 Domain Configuration

### Custom Domain
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### DNS Records
```
Type:  A
Name:  @
Value: 76.76.19.132

Type:  CNAME
Name:  www
Value: cname.vercel.sh

Type:  TXT (Verification)
Name:  _vercel
Value: (provided by Vercel)
```

---

## 📊 Post-Deployment Checks

### Health Checks
```bash
# Verify frontend loads
curl -I https://your-domain.vercel.app

# Check API health
curl https://your-domain.vercel.app/api/projects

# Verify environment variables
curl https://your-domain.vercel.app/api/site-config
```

### Performance Monitoring
- Monitor Vercel Analytics dashboard
- Check Core Web Vitals
- Review API response times
- Monitor database connection pool

### Error Monitoring
- Set up Sentry or similar error tracking
- Configure email alerts for deployments
- Monitor Vercel error logs
- Review database slow queries

---

## 🔄 Continuous Deployment

### Automatic Deployments
- Every push to `main` branch triggers deployment
- Preview deployments for pull requests
- Rollbacks available through Vercel dashboard

### Pre-Deployment Testing
```bash
# Run locally before push
npm run build
npm run lint
npm run type-check
npm run dev
```

---

## 📝 Environment Variables Reference

| Variable | Type | Required | Production |
|----------|------|----------|-----------|
| `DATABASE_URL` | secret | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | string | ✅ | ✅ |
| `NEXT_PUBLIC_BACKEND_URL` | string | ❌ | ✅ |
| `SESSION_SECRET` | secret | ✅ | ✅ |
| `EXTENSIONS_DIR` | string | ❌ | false |
| `EXTENSIONS_WRITE_ENABLED` | boolean | ❌ | false |
| `AWS_S3_BUCKET` | string | ❌ | ✅ |
| `AWS_S3_REGION` | string | ❌ | ✅ |
| `AWS_ACCESS_KEY_ID` | secret | ❌ | ✅ |
| `AWS_SECRET_ACCESS_KEY` | secret | ❌ | ✅ |

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear build cache
vercel build --prod --no-cache

# Check build logs
vercel logs --prod
```

### Environment Variables Not Applied
```bash
# Redeploy with env vars
vercel redeploy --prod

# Verify env vars
vercel env list
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
vercel env list | grep DATABASE
```

### API Routes Not Working
- Check middleware configuration
- Verify API response format matches `ApiResponse<T>`
- Check CORS headers if calling from different domain

---

## 📞 Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub Issues**: Create issue in your repository
- **Email Support**: vercel-support@example.com

---

## ✨ Success Indicators

After deployment, verify:
- ✅ Frontend loads without errors
- ✅ Products page displays data
- ✅ Dashboard shows statistics
- ✅ Admin panel is accessible
- ✅ Error boundaries work (intentionally break a component)
- ✅ Loading states display correctly
- ✅ Metadata is visible (check page source)
- ✅ Header shows credentials badges
- ✅ Footer appears on all pages

---

**Congratulations! Your Micro Headless CMS is production-ready!** 🎉
