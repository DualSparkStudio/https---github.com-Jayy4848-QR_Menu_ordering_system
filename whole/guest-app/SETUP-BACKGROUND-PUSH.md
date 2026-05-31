# Setup Background Push Notifications

## Step 1: Run Database Migration

Run this SQL in Supabase SQL Editor:

```bash
# Copy the SQL file content
cat prisma/add-push-subscriptions.sql
```

Then paste and execute in Supabase Dashboard → SQL Editor

## Step 2: Setup Supabase Webhook

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook for **Order table INSERT**:
   - Name: `push-new-order`
   - Table: `Order`
   - Events: `INSERT`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://cafeqrsystem.netlify.app/.netlify/functions/push-worker`
   - HTTP Headers: `Content-Type: application/json`

3. Create webhook for **Order table UPDATE**:
   - Name: `push-order-status`
   - Table: `Order`
   - Events: `UPDATE`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://cafeqrsystem.netlify.app/.netlify/functions/push-worker`
   - HTTP Headers: `Content-Type: application/json`

4. Create webhook for **OrderItem table INSERT**:
   - Name: `push-new-item`
   - Table: `OrderItem`
   - Events: `INSERT`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://cafeqrsystem.netlify.app/.netlify/functions/push-worker`
   - HTTP Headers: `Content-Type: application/json`

## Step 3: Deploy

```bash
npm run build
netlify deploy --prod
```

## Step 4: Test

1. Open admin page on desktop
2. Allow notifications when prompted
3. Check console for "Push subscription active"
4. Close browser or switch tabs
5. Place order from guest app
6. You should receive push notification even with browser closed!

## How It Works

1. **User subscribes**: Browser registers for push notifications, subscription saved to database
2. **Order created**: Database trigger fires webhook to Netlify function
3. **Netlify function**: Fetches subscriptions from database, sends push via Web Push API
4. **Service worker**: Receives push and shows notification even when app is closed

## Troubleshooting

- **No subscription**: Check console for "Push subscription active"
- **No notifications**: Check Supabase webhook logs for errors
- **Invalid subscription**: Old subscriptions auto-deactivated on 410/404 errors
