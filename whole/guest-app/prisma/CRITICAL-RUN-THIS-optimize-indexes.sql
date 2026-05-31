-- ============================================
-- CRITICAL PERFORMANCE INDEXES
-- RUN THIS IN SUPABASE SQL EDITOR IMMEDIATELY
-- Expected improvement: 5-10x faster queries
-- ============================================

-- Orders table indexes (MOST CRITICAL)
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON "Order"("tableId", "status");
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON "Order"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "Order"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table_created ON "Order"("tableId", "createdAt" DESC);

-- OrderItems table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON "OrderItem"("menuItemId");
CREATE INDEX IF NOT EXISTS idx_order_items_updated_at ON "OrderItem"("updatedAt" DESC);

-- MenuItems table indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON "MenuItem"("restaurantId", "isAvailable");
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON "MenuItem"("categoryId", "displayOrder");

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON "Category"("restaurantId", "displayOrder");

-- Tables table indexes
CREATE INDEX IF NOT EXISTS idx_tables_qr_code ON "Table"("qrCode");
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON "Table"("restaurantId", "status");

-- Coupons table indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON "Coupon"("restaurantId", "code", "isActive");

-- ============================================
-- VERIFY INDEXES WERE CREATED
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
