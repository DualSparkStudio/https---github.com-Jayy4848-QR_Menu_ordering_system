# Performance Diagnostic Guide

## Problem: System is Still Slow

If the system is still slow after the latest updates, follow these steps to diagnose:

## Step 1: Check if Database Indexes Exist

**Go to Supabase SQL Editor and run:**

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('Order', 'OrderItem', 'MenuItem', 'Table', 'Category')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected Result**: Should show 10 indexes (idx_orders_restaurant_status, idx_orders_table_status, etc.)

**If you see 0 rows**: ❌ Indexes are NOT created - this is the main cause of slowness!

**Solution**: Run the SQL script from `guest-app/prisma/optimize-indexes.sql`

---

## Step 2: Check Database Connection

**Go to Supabase Settings → Database → Connection String**

**Verify you're using the POOLING connection string:**
- ✅ Should contain: `pgbouncer=true&connection_limit=1`
- ❌ Should NOT be the direct connection string

**Your current DATABASE_URL should look like:**
```
postgresql://postgres.chnzfuszszkoaginjfwzi:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

---

## Step 3: Test API Response Times

**Open browser DevTools (F12) → Network tab**

**Place an order and check these endpoints:**

1. **POST /api/restaurants/.../tables/.../orders**
   - ✅ Good: < 500ms
   - ⚠️ Slow: 500ms - 2s
   - ❌ Very Slow: > 2s

2. **GET /api/tables/.../orders/active**
   - ✅ Good: < 200ms
   - ⚠️ Slow: 200ms - 1s
   - ❌ Very Slow: > 1s

3. **GET /api/restaurants/.../menu/categories**
   - ✅ Good: < 300ms (first load), < 50ms (cached)
   - ⚠️ Slow: 300ms - 1s
   - ❌ Very Slow: > 1s

**If all endpoints are slow**: Database indexes are missing!

---

## Step 4: Check Netlify Function Logs

**Go to Netlify Dashboard → Functions → View logs**

**Look for:**
- ❌ "Prisma Client initialization" errors
- ❌ "Connection timeout" errors
- ❌ "Too many connections" errors

**If you see connection errors**: Increase `connection_limit` in DATABASE_URL from 1 to 5

---

## Step 5: Verify Latest Deployment

**Check Netlify deployment:**
- Latest commit should be: "fix: allow same session to continue ordering, reduce polling frequency"
- Deployment status: ✅ Published

**If deployment failed**: Check build logs for errors

---

## Quick Fix Checklist

- [ ] Run database indexes SQL script in Supabase
- [ ] Verify DATABASE_URL uses pooling endpoint with `pgbouncer=true`
- [ ] Clear browser cache and test again
- [ ] Check Network tab for slow API calls
- [ ] Verify latest code is deployed on Netlify

---

## Expected Performance (After All Fixes)

**Order Placement:**
- Click "Place Order" → Navigate to order page: **< 1 second**
- No "Cart is empty" flash

**Menu Loading:**
- First load: **< 500ms**
- Subsequent loads: **< 100ms** (cached)

**Table Occupancy Check:**
- Same user can continue ordering: **✅ Works**
- Different user sees "Table Occupied": **✅ Works**

---

## Still Slow? Contact Support

If after completing ALL steps above the system is still slow, provide:

1. Screenshot of database indexes query result
2. Screenshot of Network tab showing slow API calls
3. Your DATABASE_URL (hide password)
4. Netlify deployment URL
5. Browser console errors (if any)
