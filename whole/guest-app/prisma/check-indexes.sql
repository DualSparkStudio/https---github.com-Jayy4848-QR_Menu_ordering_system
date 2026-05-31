-- Run this in Supabase SQL Editor to check if performance indexes exist
-- If you see 0 rows, you MUST run optimize-indexes.sql

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND tablename IN ('Order', 'OrderItem', 'MenuItem', 'Table', 'Category')
ORDER BY tablename, indexname;

-- Expected result: 10 rows
-- If you see less than 10 rows, some indexes are missing
-- If you see 0 rows, NO indexes exist (this is why the system is slow!)
