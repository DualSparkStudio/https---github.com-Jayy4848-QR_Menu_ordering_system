-- Fix QR code URLs from localhost to production
-- Run this in Supabase SQL Editor after adding GUEST_APP_URL environment variable

UPDATE "Table"
SET "qrCodeUrl" = REPLACE("qrCodeUrl", 'http://localhost:3000', 'https://cafeqrsystem.netlify.app')
WHERE "qrCodeUrl" LIKE '%localhost:3000%';

-- Verify the update
SELECT "id", "tableNumber", "qrCode", "qrCodeUrl" 
FROM "Table" 
WHERE "deletedAt" IS NULL;
