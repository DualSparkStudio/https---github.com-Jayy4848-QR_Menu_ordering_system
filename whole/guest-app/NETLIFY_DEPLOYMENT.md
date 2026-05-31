# Netlify Deployment Guide

## Backend Conversion Complete

The NestJS backend has been successfully converted to Netlify Functions. All API endpoints are now serverless functions that run on Netlify.

## Prerequisites

1. **Supabase PostgreSQL Database**
   - Create a Supabase project at https://supabase.com
   - Get your database connection string from Project Settings → Database
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres`

2. **Environment Variables**
   - You'll need to set these in Netlify dashboard

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Convert backend to Netlify Functions"
git push origin main
```

### 2. Connect to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `guest-app`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.next`

### 3. Set Environment Variables

In Netlify dashboard, go to Site settings → Environment variables and add:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
GUEST_APP_URL=https://your-site-name.netlify.app
NODE_ENV=production
```

### 4. Run Database Migrations

After first deployment, you need to run Prisma migrations:

1. Install Netlify CLI locally:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Link your site:
```bash
cd guest-app
netlify link
```

4. Run migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Seed the database (optional):
```bash
npx prisma db seed
```

### 5. Deploy

Netlify will automatically deploy when you push to GitHub. You can also trigger manual deploys from the Netlify dashboard.

## API Endpoints

All API endpoints are now available at:
- `https://your-site-name.netlify.app/api/*`

Examples:
- `POST /api/auth/staff/login` - Staff login
- `GET /api/restaurants/:id/menu/categories` - Get menu categories
- `POST /api/restaurants/:restaurantId/tables/:tableId/orders` - Create order
- `GET /api/orders/:id` - Get order details

## Converted Functions

The following Netlify Functions have been created:

### Authentication
- `auth-staff-login.ts` - Staff login
- `auth-table-session.ts` - Create table session
- `auth-refresh.ts` - Refresh JWT token

### Menu
- `menu-categories.ts` - List/create categories
- `menu-category.ts` - Update/delete category
- `menu-items.ts` - List/create menu items
- `menu-item.ts` - Get/update/delete menu item

### Orders
- `orders-create.ts` - Create new order
- `orders-list.ts` - List orders (admin)
- `orders-get.ts` - Get order by ID
- `orders-active.ts` - Get active orders for table
- `orders-update-status.ts` - Update order status
- `orders-mark-paid.ts` - Mark order as paid

### Tables
- `tables-list.ts` - List tables
- `tables-create.ts` - Create table
- `tables-update.ts` - Update/delete table
- `tables-qr.ts` - Get table by QR code

### Coupons
- `coupons.ts` - List/create/validate coupons
- `coupon-toggle.ts` - Toggle/delete coupon

### Reviews
- `reviews.ts` - List/create reviews, get stats

### Payments
- `payments-razorpay-create.ts` - Create Razorpay order
- `payments-razorpay-verify.ts` - Verify Razorpay payment

### Admin
- `admin-dashboard.ts` - Dashboard statistics
- `admin-revenue.ts` - Revenue statistics
- `admin-staff.ts` - Staff management

### Restaurant
- `restaurants.ts` - Restaurant CRUD operations

## Testing Locally

To test Netlify Functions locally:

```bash
cd guest-app
npm install
netlify dev
```

This will start:
- Next.js dev server on http://localhost:3000
- Netlify Functions on http://localhost:3000/.netlify/functions/*

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct in Netlify environment variables
- Check Supabase project is active
- Ensure IP allowlist in Supabase includes Netlify's IPs (or allow all)

### Function Timeout
- Netlify Functions have a 10-second timeout on free tier
- Optimize slow queries
- Consider upgrading to Pro plan for 26-second timeout

### Cold Starts
- First request after inactivity may be slow (cold start)
- This is normal for serverless functions
- Subsequent requests will be faster

### CORS Issues
- All functions include CORS headers
- If issues persist, check browser console for specific errors

## Migration from NestJS

The original NestJS backend in the `backend/` folder is no longer needed for Netlify deployment. However, you can keep it for:
- Local development
- Running on other platforms (Render, Railway, etc.)
- Backup/reference

## Support

For issues:
1. Check Netlify function logs in dashboard
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Test API endpoints using Postman or curl
