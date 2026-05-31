# Quick Supabase Setup Guide

## Step 1: Run SQL in Supabase

1. Go to your Supabase dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### 1.1 Create Tables
1. Copy the entire content of `prisma/schema.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** (or press Ctrl+Enter)
4. Wait for success message: ✅ Success. No rows returned

### 1.2 Insert Seed Data
1. Click **"New query"** again
2. Copy the entire content of `prisma/seed-data.sql`
3. Paste it into the SQL Editor
4. Click **"Run"**
5. Wait for success message

## Step 2: Get Connection String

### Option A: Build it Manually
Your connection string format:
```
postgresql://postgres.chmduzckoapnjhwzi:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Replace:
- `[YOUR-PASSWORD]` with your database password
- `[REGION]` with your region (e.g., `ap-southeast-1` for Singapore, `us-east-1` for US East)

**Common regions:**
- Singapore: `ap-southeast-1`
- Mumbai: `ap-south-1`
- US East: `us-east-1`
- US West: `us-west-1`
- Europe: `eu-west-1`

**Example:**
```
postgresql://postgres.chmduzckoapnjhwzi:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Option B: Find it in Supabase
1. Click the **gear icon ⚙️** at bottom of left sidebar (Project Settings)
2. Click **"Database"** in settings menu
3. Scroll to **"Connection string"** section
4. Click **"URI"** tab
5. Copy and replace `[YOUR-PASSWORD]` with actual password

## Step 3: Add to Netlify Environment Variables

1. Go to **Netlify Dashboard** → Your Site
2. Click **"Site settings"**
3. Click **"Environment variables"** in left sidebar
4. Click **"Add a variable"**

Add these two variables:

### Variable 1: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Your connection string from Step 2
  ```
  postgresql://postgres.chmduzckoapnjhwzi:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```

### Variable 2: JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: Any random string (32+ characters)
  ```
  my-super-secret-jwt-key-change-this-12345678
  ```

## Step 4: Create Local .env File

Create a file named `.env` in the `guest-app` folder:

```env
DATABASE_URL="postgresql://postgres.chmduzckoapnjhwzi:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="my-super-secret-jwt-key-change-this-12345678"
```

**Important:** Use the SAME values as Netlify!

## Step 5: Redeploy on Netlify

1. Go to Netlify Dashboard → Your Site
2. Click **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
4. Wait 2-3 minutes for deployment

## Step 6: Test Your Application

### Admin Login
- URL: Your site URL
- Email: `admin@thefork.com`
- Password: `admin123`

### Guest App
- URL: `https://your-site.netlify.app/?table=25ex69ed8`
- Should show menu with 16 items

## What's Included in Seed Data

✅ **Restaurant**: The Fork Restaurant (Mumbai)  
✅ **Admin**: admin@thefork.com / admin123  
✅ **6 Tables**: QR codes: 25ex69ed8, pbesg49n6, xyz123abc, abc456def, def789ghi, ghi012jkl  
✅ **5 Categories**: Starters, Main Course, Breads, Desserts, Beverages  
✅ **16 Menu Items**: Prices in ₹ (INR)  
✅ **2 Coupons**: WELCOME10, FLAT50  

## Troubleshooting

### SQL Error: "relation already exists"
- Tables already created. Skip schema.sql and run only seed-data.sql

### SQL Error: "duplicate key value"
- Data already inserted. You're good to go!

### 502 Error still happening
- Check DATABASE_URL is correct in Netlify
- Make sure you redeployed after adding environment variables
- Check Netlify function logs for specific error

### Can't login
- Make sure seed-data.sql ran successfully
- Check if Staff table has the admin user
- Password is: `admin123`

## Verify Data in Supabase

1. Click **"Table Editor"** in left sidebar
2. Check these tables have data:
   - **Restaurant**: 1 row
   - **Staff**: 1 row (admin@thefork.com)
   - **Table**: 6 rows
   - **Category**: 5 rows
   - **MenuItem**: 16 rows
   - **Coupon**: 2 rows

## Security Notes

⚠️ **After first login, change the admin password!**  
⚠️ **Never commit .env file to git**  
⚠️ **Use a strong JWT_SECRET in production**

---

That's it! Your database should now be set up and working. 🎉
