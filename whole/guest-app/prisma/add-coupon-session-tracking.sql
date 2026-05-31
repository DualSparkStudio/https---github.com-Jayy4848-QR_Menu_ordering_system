-- Add usedBySessions column to Coupon table for per-user coupon tracking
-- This allows tracking which sessionIds have used each coupon

ALTER TABLE "Coupon" 
ADD COLUMN IF NOT EXISTS "usedBySessions" TEXT;

-- Initialize existing coupons with empty array
UPDATE "Coupon" 
SET "usedBySessions" = '[]' 
WHERE "usedBySessions" IS NULL;

-- Add comment to column
COMMENT ON COLUMN "Coupon"."usedBySessions" IS 'JSON array of sessionIds that have used this coupon';
