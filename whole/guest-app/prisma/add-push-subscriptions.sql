-- Add PushSubscription table
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "restaurantId" TEXT,
    "tableId" TEXT,
    "endpoint" TEXT NOT NULL UNIQUE,
    "keys" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_userType_idx" ON "PushSubscription"("userId", "userType");
CREATE INDEX IF NOT EXISTS "PushSubscription_restaurantId_idx" ON "PushSubscription"("restaurantId");
CREATE INDEX IF NOT EXISTS "PushSubscription_tableId_idx" ON "PushSubscription"("tableId");

-- Function to send push notifications on new order
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    restaurant_id TEXT;
    table_num TEXT;
    order_num TEXT;
BEGIN
    -- Get restaurant ID and table number
    SELECT "restaurantId", "tableNumber" INTO restaurant_id, table_num
    FROM "Table"
    WHERE "id" = NEW."tableId";
    
    -- Get order number
    order_num := SUBSTRING(NEW."orderNumber" FROM LENGTH(NEW."orderNumber") - 5);
    
    -- Send notification via pg_notify (will be picked up by a worker)
    PERFORM pg_notify(
        'push_notification',
        json_build_object(
            'type', 'new_order',
            'restaurantId', restaurant_id,
            'title', '🔔 New Order!',
            'body', 'Order #' || order_num || ' - Table ' || table_num,
            'data', json_build_object('orderId', NEW."id", 'type', 'new_order')
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_notify_new_order ON "Order";
CREATE TRIGGER trigger_notify_new_order
    AFTER INSERT ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

-- Function to send push notifications on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    table_id TEXT;
    order_num TEXT;
    status_msg TEXT;
BEGIN
    -- Only notify on status change
    IF NEW."status" = OLD."status" THEN
        RETURN NEW;
    END IF;
    
    -- Get table ID
    table_id := NEW."tableId";
    
    -- Get order number
    order_num := SUBSTRING(NEW."orderNumber" FROM LENGTH(NEW."orderNumber") - 5);
    
    -- Determine message based on status
    status_msg := CASE NEW."status"
        WHEN 'confirmed' THEN '✅ Order Confirmed!'
        WHEN 'preparing' THEN '👨‍🍳 Preparing Your Order'
        WHEN 'ready' THEN '🔔 Order Ready!'
        WHEN 'served' THEN '🍽️ Enjoy Your Meal!'
        ELSE NULL
    END;
    
    -- Only send notification for relevant statuses
    IF status_msg IS NOT NULL THEN
        PERFORM pg_notify(
            'push_notification',
            json_build_object(
                'type', 'status_update',
                'tableId', table_id,
                'title', status_msg,
                'body', 'Order #' || order_num,
                'data', json_build_object('orderId', NEW."id", 'type', 'status_update')
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON "Order";
CREATE TRIGGER trigger_notify_order_status_change
    AFTER UPDATE ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change();
