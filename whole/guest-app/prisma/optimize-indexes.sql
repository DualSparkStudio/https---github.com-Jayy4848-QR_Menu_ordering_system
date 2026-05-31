-- Add indexes for faster queries
-- Run this in Supabase SQL Editor to improve performance

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON "Order"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON "Order"("tableId", "status");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "Order"("createdAt" DESC);

-- OrderItem table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_menu ON "OrderItem"("menuItemId");

-- MenuItem table indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON "MenuItem"("restaurantId", "isAvailable");
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON "MenuItem"("categoryId", "isAvailable");

-- Table table indexes
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON "Table"("restaurantId", "isActive");
CREATE INDEX IF NOT EXISTS idx_tables_qr ON "Table"("qrCode");

-- Category table indexes
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON "Category"("restaurantId", "isActive");

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('Order', 'OrderItem', 'MenuItem', 'Table', 'Category')
ORDER BY tablename, indexname;
