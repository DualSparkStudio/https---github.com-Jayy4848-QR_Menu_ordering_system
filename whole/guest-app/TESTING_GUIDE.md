# Testing Guide - QR Menu Ordering System

## ⚠️ Important: Netlify Functions + Prisma Local Development Issue

There's a known issue with running Netlify Functions locally when using Prisma. The Netlify CLI bundler has trouble with Prisma's binary files.

**Recommended Approach:** Test on Netlify's production/preview environment instead of localhost.

---

## 🚀 Option 1: Test on Netlify (RECOMMENDED)

This is the easiest and most reliable way to test your app.

### Step 1: Set Up Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open **SQL Editor** → **New query**
3. Copy and paste content from `prisma/schema.sql`
4. Click **Run** → Wait for success ✅
5. Click **New query** again
6. Copy and paste content from `prisma/seed-data.sql`
7. Click **Run** → Wait for success ✅

### Step 2: Add Environment Variables to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: **cafeqrsystem**
3. Go to **Site settings** → **Environment variables**
4. Add these variables:

**DATABASE_URL:**
```
postgresql://postgres:cafeqrsyste@db.chnzfuzczkoaginjfwzi.supabase.co:5432/postgres
```

**JWT_SECRET:**
```
my-super-secret-jwt-key-change-this-12345
```

### Step 3: Deploy to Netlify

```bash
# Commit your changes
git add .
git commit -m "Add Netlify Functions and Supabase integration"
git push origin main
```

Or manually trigger deploy:
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait 2-3 minutes for deployment

### Step 4: Test Your App

**Production URL:** `https://cafeqrsystem.netlify.app`

**Admin Login:**
- URL: `https://cafeqrsystem.netlify.app`
- Email: `admin@thefork.com`
- Password: `admin123`

**Guest App (with QR code):**
- URL: `https://cafeqrsystem.netlify.app/?table=25ex69ed8`
- Should show menu with 16 items

**Available QR Codes:**
- `25ex69ed8` - Table 1 (Main Hall, 4 seats)
- `pbesg49n6` - Table 2 (Main Hall, 2 seats)
- `xyz123abc` - Table 3 (Main Hall, 6 seats)
- `abc456def` - Table 4 (Patio, 4 seats)
- `def789ghi` - Table 5 (Patio, 2 seats)
- `ghi012jkl` - Table 6 (Private, 8 seats)

---

## 🔧 Option 2: Local Development (Frontend Only)

If you want to develop the frontend locally, you can run Next.js without the functions:

```bash
npm run dev:next
```

This runs on `http://localhost:3000` but **API calls won't work** (they'll fail with 404).

**Use this for:**
- UI/UX development
- Frontend component testing
- Layout and styling work

**Don't use this for:**
- Testing API endpoints
- Testing database operations
- Testing authentication
- Full end-to-end testing

---

## 🐛 Option 3: Local Development with Mock Data (Alternative)

If you need to test locally with data, you can:

1. Create mock API responses in your frontend code
2. Use localStorage for temporary data storage
3. Use a local JSON server

This requires code changes and is not recommended for production testing.

---

## 📊 Verify Database Setup

After running the SQL files, verify in Supabase:

1. Go to **Table Editor** in Supabase
2. Check these tables have data:
   - **Restaurant**: 1 row (The Fork Restaurant)
   - **Staff**: 1 row (admin@thefork.com)
   - **Table**: 6 rows (with QR codes)
   - **Category**: 5 rows (Starters, Main Course, etc.)
   - **MenuItem**: 16 rows (menu items with prices)
   - **Coupon**: 2 rows (WELCOME10, FLAT50)

---

## 🔍 Debugging on Netlify

### Check Function Logs

1. Go to Netlify Dashboard → Your Site
2. Click **Functions** tab
3. Click on any function to see logs
4. Check for errors in the logs

### Check Deploy Logs

1. Go to **Deploys** tab
2. Click on the latest deploy
3. Scroll through the build log
4. Look for any errors during build or deployment

### Common Issues

**502 Bad Gateway:**
- Check DATABASE_URL is correct in Netlify environment variables
- Make sure Supabase database is accessible
- Check function logs for specific errors

**404 Not Found:**
- Check `netlify.toml` redirects are correct
- Make sure functions are deployed (check Functions tab)
- Verify the API route matches the redirect rule

**Authentication Errors:**
- Check JWT_SECRET is set in Netlify
- Verify admin user exists in database
- Check password hash is correct

---

## 📝 Summary

**For Testing:** Use Netlify production/preview environment (Option 1)  
**For Frontend Development:** Use `npm run dev:next` (Option 2)  
**For Full Local Development:** Not recommended due to Netlify CLI + Prisma issues

---

## 🆘 Need Help?

- Check `SUPABASE_QUICK_SETUP.md` for database setup
- Check Netlify function logs for errors
- Verify environment variables are set correctly
- Make sure SQL files ran successfully in Supabase

