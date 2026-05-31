# Database Setup Instructions

## 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `qr-menu-system` (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

## 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

## 3. Configure Environment Variables

### Local Development (.env file)

Create a `.env` file in the `guest-app` directory:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-to-something-random"
```

### Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `JWT_SECRET` | A random secure string (same as local) |

**Important**: After adding environment variables, you need to **redeploy** your site for them to take effect.

## 4. Run Database Migrations

```bash
cd guest-app

# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Seed initial data
npm run db:seed
```

## 5. Verify Setup

After seeding, you should see:

```
✅ Restaurant created: The Fork Restaurant
✅ Admin user created: admin@thefork.com
✅ Tables created: 6
✅ Categories created: 5
✅ Menu items created: 16
✅ Coupons created: 2
🎉 Seed completed successfully!

📝 Login credentials:
   Email: admin@thefork.com
   Password: admin123

🔗 QR Codes for tables:
   Table 1: 25ex69ed8
   Table 2: pbesg49n6
   Table 3: xyz123abc
   Table 4: abc456def
   Table 5: def789ghi
   Table 6: ghi012jkl
```

## 6. Test the Application

### Admin Dashboard
1. Go to your admin dashboard URL
2. Login with:
   - **Email**: `admin@thefork.com`
   - **Password**: `admin123`

### Guest App
1. Go to your guest app URL
2. Add a table QR code to the URL: `?table=25ex69ed8`
3. You should see the menu

## Seed Data Included

### Restaurant
- **Name**: The Fork Restaurant
- **Location**: Mumbai, Maharashtra, India
- **Currency**: INR (₹)
- **Tax**: 5%
- **Service Charge**: 10%

### Admin User
- **Email**: admin@thefork.com
- **Password**: admin123
- **Role**: admin

### Tables (6 tables)
- Tables 1-3: Main Hall
- Tables 4-5: Patio
- Table 6: Private (8 capacity)

### Menu Categories (5 categories)
1. **Starters** - 3 items
2. **Main Course** - 4 items
3. **Breads** - 3 items
4. **Desserts** - 3 items
5. **Beverages** - 3 items

### Sample Menu Items (16 items)
- Spring Rolls (₹150)
- Chicken Wings (₹250)
- Paneer Tikka (₹200)
- Butter Chicken (₹350)
- Paneer Tikka Masala (₹300)
- Dal Makhani (₹250)
- Biryani (₹400)
- Naan (₹40)
- Garlic Naan (₹50)
- Roti (₹30)
- Gulab Jamun (₹100)
- Rasmalai (₹120)
- Ice Cream (₹80)
- Masala Chai (₹40)
- Mango Lassi (₹80)
- Soft Drinks (₹50)

### Coupons (2 coupons)
1. **WELCOME10** - 10% off on first order (min ₹500)
2. **FLAT50** - ₹50 off on orders above ₹300

## Troubleshooting

### Error: "Can't reach database server"
- Check your DATABASE_URL is correct
- Verify your Supabase project is running
- Check if your IP is allowed (Supabase allows all by default)

### Error: "Environment variable not found: DATABASE_URL"
- Make sure you created the `.env` file
- Restart your development server after creating `.env`
- For Netlify, redeploy after adding environment variables

### Error: "Invalid credentials" when logging in
- Make sure you ran the seed script
- Check the database has the staff record
- Password should be: `admin123`

### Prisma Client errors
- Run `npm run db:generate` to regenerate the client
- Make sure `@prisma/client` is installed

## Database Management

### View Database in Supabase
1. Go to your Supabase dashboard
2. Click **Table Editor** in the sidebar
3. You'll see all your tables

### View Database Locally
```bash
npm run db:studio
```
This opens Prisma Studio at http://localhost:5555

### Reset Database (WARNING: Deletes all data)
```bash
# Push schema again (this will reset)
npm run db:push -- --force-reset

# Re-seed data
npm run db:seed
```

## Production Deployment Checklist

- [ ] Supabase project created
- [ ] DATABASE_URL added to Netlify environment variables
- [ ] JWT_SECRET added to Netlify environment variables
- [ ] Database migrations run (`npm run db:push`)
- [ ] Seed data added (`npm run db:seed`)
- [ ] Site redeployed on Netlify
- [ ] Admin login tested
- [ ] Guest app tested with QR code
- [ ] Orders can be placed successfully

## Security Notes

1. **Change the default admin password** after first login
2. **Use a strong JWT_SECRET** in production (not the example one)
3. **Never commit `.env` file** to git (it's in .gitignore)
4. **Rotate JWT_SECRET** periodically for security
5. **Enable Row Level Security (RLS)** in Supabase for additional protection
