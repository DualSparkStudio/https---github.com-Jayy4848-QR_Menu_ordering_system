import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { pushNotifications } from '@/lib/pushNotifications';

interface NotificationConfig {
  restaurantId?: string;
  tableId?: string;
  userType: 'admin' | 'guest';
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (order: any) => void;
  onNewItem?: (item: any) => void;
}

export function useRealtimeNotifications(config: NotificationConfig) {
  const channelRef = useRef<any>(null);
  const { restaurantId, tableId, userType, onNewOrder, onOrderUpdate, onNewItem } = config;

  useEffect(() => {
    // Initialize push notifications
    pushNotifications.initialize();

    // Set up Supabase Realtime channel
    const setupRealtime = async () => {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Create channel name based on user type
      const channelName = userType === 'admin' 
        ? `restaurant:${restaurantId}` 
        : `table:${tableId}`;

      // Subscribe to Order changes
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Order',
            filter: userType === 'admin' 
              ? `restaurantId=eq.${restaurantId}`
              : `tableId=eq.${tableId}`,
          },
          (payload) => {
            console.log('New order:', payload);
            handleNewOrder(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Order',
            filter: userType === 'admin' 
              ? `restaurantId=eq.${restaurantId}`
              : `tableId=eq.${tableId}`,
          },
          (payload) => {
            console.log('Order updated:', payload);
            handleOrderUpdate(payload.new, payload.old);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'OrderItem',
          },
          (payload) => {
            console.log('New item added:', payload);
            handleNewItem(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      channelRef.current = channel;
    };

    if ((userType === 'admin' && restaurantId) || (userType === 'guest' && tableId)) {
      setupRealtime();
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [restaurantId, tableId, userType]);

  // Handle new order
  const handleNewOrder = (order: any) => {
    if (userType === 'admin') {
      // Admin notification
      pushNotifications.showNotification('🔔 New Order!', {
        body: `Order #${order.orderNumber?.slice(-6)} - Table ${order.tableNumber || 'N/A'}`,
        data: { orderId: order.id, type: 'new_order' },
      });

      // Play sound
      if (typeof window !== 'undefined') {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {});
      }

      // Vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }

    // Call callback
    if (onNewOrder) {
      onNewOrder(order);
    }
  };

  // Handle order update
  const handleOrderUpdate = (newOrder: any, oldOrder: any) => {
    // Check if status changed
    if (newOrder.status !== oldOrder.status) {
      if (userType === 'guest') {
        // Guest notification
        const statusMessages: Record<string, string> = {
          confirmed: '✅ Order Confirmed!',
          preparing: '👨‍🍳 Preparing Your Order',
          ready: '🔔 Order Ready!',
          served: '🍽️ Enjoy Your Meal!',
        };

        const message = statusMessages[newOrder.status];
        if (message) {
          pushNotifications.showNotification(message, {
            body: `Order #${newOrder.orderNumber?.slice(-6)}`,
            data: { orderId: newOrder.id, type: 'status_update' },
          });

          // Vibrate
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      }
    }

    // Call callback
    if (onOrderUpdate) {
      onOrderUpdate(newOrder);
    }
  };

  // Handle new item added to existing order
  const handleNewItem = async (item: any) => {
    // Fetch order details to check if it belongs to this user
    try {
      const { data: order } = await supabase
        .from('Order')
        .select('*, table:Table(*)')
        .eq('id', item.orderId)
        .single();

      if (!order) return;

      // Check if this order belongs to current context
      const belongsToContext = userType === 'admin' 
        ? order.restaurantId === restaurantId
        : order.tableId === tableId;

      if (!belongsToContext) return;

      if (userType === 'admin') {
        // Admin notification for new item
        pushNotifications.showNotification('➕ Item Added to Order', {
          body: `Order #${order.orderNumber?.slice(-6)} - Table ${order.table?.tableNumber}`,
          data: { orderId: order.id, type: 'new_item' },
        });

        // Play sound
        if (typeof window !== 'undefined') {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        }
      }

      // Call callback
      if (onNewItem) {
        onNewItem(item);
      }
    } catch (error) {
      console.error('Error handling new item:', error);
    }
  };
}
