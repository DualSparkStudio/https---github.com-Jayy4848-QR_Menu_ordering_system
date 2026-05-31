'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from './notificationStore';
import { notifyNewOrder, notifyOrderUpdate, initializeNotifications } from './notificationUtils';
import { getWebSocketUrl } from './config';

interface UseOrderNotificationsOptions {
  restaurantId: string | undefined;
  enabled: boolean;
}

/**
 * Hook that connects to the WebSocket server and listens for new order events.
 * Should be initialized once at the AdminLayout level so it works across all views.
 */
export function useOrderNotifications({ restaurantId, enabled }: UseOrderNotificationsOptions) {
  const socketRef = useRef<Socket | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleOrderPlaced = useCallback(
    (data: any) => {
      if (!data) return;

      const orderNumber = data.orderNumber || '';
      const tableNumber = data.table?.tableNumber || data.tableNumber || '?';
      const totalAmount = data.totalAmount || 0;
      const itemCount = data.items?.length || 0;
      const shortOrder = orderNumber.slice(-6) || orderNumber;

      // Add to in-app notification store (this also plays the sound)
      addNotification({
        type: 'new_order',
        title: '🔔 New Order!',
        message: `Order #${shortOrder} · Table ${tableNumber} · ${itemCount} item${itemCount !== 1 ? 's' : ''} · ₹${totalAmount.toFixed?.(0) ?? totalAmount}`,
        orderNumber: shortOrder,
        tableNumber,
        totalAmount,
        itemCount,
      });

      // Also show browser notification
      notifyNewOrder(shortOrder, tableNumber);
    },
    [addNotification],
  );

  const handleOrderUpdated = useCallback(
    (data: any) => {
      if (!data) return;

      const orderNumber = data.orderNumber || '';
      const tableNumber = data.table?.tableNumber || data.tableNumber || '?';
      const totalAmount = data.totalAmount || 0;
      const itemCount = data.items?.length || 0;
      const shortOrder = orderNumber.slice(-6) || orderNumber;

      // Only notify for item additions (order_updated with new items)
      // We detect this by checking if any items are pending status
      const hasPendingItems = data.items?.some((item: any) => item.status === 'pending');
      if (!hasPendingItems) return;

      addNotification({
        type: 'order_updated',
        title: '📝 Items Added',
        message: `Order #${shortOrder} · Table ${tableNumber} · Items updated · ₹${totalAmount.toFixed?.(0) ?? totalAmount}`,
        orderNumber: shortOrder,
        tableNumber,
        totalAmount,
        itemCount,
      });

      notifyOrderUpdate(shortOrder, tableNumber, itemCount);
    },
    [addNotification],
  );

  useEffect(() => {
    if (!enabled || !restaurantId) return;

    // Initialize browser notifications (request permission)
    initializeNotifications();

    const wsUrl = getWebSocketUrl();

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Notifications] WebSocket connected:', socket.id);
      // Join restaurant room to receive order events
      socket.emit('join_restaurant', { restaurantId });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Notifications] WebSocket disconnected:', reason);
    });

    socket.on('reconnect', () => {
      console.log('[Notifications] WebSocket reconnected');
      socket.emit('join_restaurant', { restaurantId });
    });

    // Listen for order events
    socket.on('order_placed', handleOrderPlaced);
    socket.on('order_updated', handleOrderUpdated);

    return () => {
      socket.off('order_placed', handleOrderPlaced);
      socket.off('order_updated', handleOrderUpdated);
      socket.emit('leave_restaurant', { restaurantId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, restaurantId, handleOrderPlaced, handleOrderUpdated]);

  return socketRef;
}
