# Local Development Guide

## ⚠️ Known Issue: Netlify Functions + Prisma

There's a known compatibility issue between Netlify CLI and Prisma when running locally. The bundler has trouble with Prisma's binary files, causing functions to fail to load.

**Recommended Solution:** Test on Netlify's deployed environment instead of localhost. See `TESTING_GUIDE.md` for details.

---

## Prerequisites

Before running locally, you need to:

1. ✅ Have Supabase database set up (run schema.sql and seed-data.sql)
2. ✅ Have `.env` file in `guest-app/` folder with:
   - `DATABASE_URL` - Your Supabase connection string
   - `JWT_SECRET` - Your JWT secret key

## Option 1: Frontend Development Only (WORKS)

Run Next.js without Netlify Functions:

```bash
npm run dev:next
```

This will start:
- **Next.js app** on `http://localhost:3000`
- **No API functions** - API calls will fail with 404

**Use this for:**
- UI/UX development
- Frontend component testing
- Layout and styling work

**Don't use this for:**
- Testing API endpoints
- Testing database operations
- Testing authentication

## Option 2: Full Stack Testing (USE NETLIFY)

For testing the complete application with API functions:

1. Deploy to Netlify (see `TESTING_GUIDE.md`)
2. Test on production URL: `https://cafeqrsystem.netlify.app`

This is the most reliable way to test your app.

---

## Attempting Local Netlify Dev (NOT RECOMMENDED)

If you still want to try running Netlify Functions locally (may not work):

```bash
npm run dev
```

**Known Issues:**
- Prisma bundling errors
- Functions fail to load
- EISDIR errors with `.prisma` directory

If you encounter these errors, use Option 1 or Option 2 above.

---

**Need help?** Check the main README or Supabase setup guide.
