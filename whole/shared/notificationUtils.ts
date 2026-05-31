/**
 * Browser notification utilities
 */

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted'
  );
}

/**
 * Show a browser notification
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export async function showNotification(options: NotificationOptions): Promise<Notification | null> {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return null;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted. Current permission:', Notification.permission);
    return null;
  }

  try {
    // Try to use service worker notification (required on mobile)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      // Build notification options without vibrate (not supported in service worker API)
      const notificationOptions: globalThis.NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon.png',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? true,
        silent: options.silent ?? false,
      };
      
      // Add vibrate if supported (some browsers support it)
      if (options.vibrate) {
        (notificationOptions as any).vibrate = options.vibrate;
      }
      
      await registration.showNotification(options.title, notificationOptions);
      console.log('Notification shown via service worker');
      
      // Trigger vibration separately if supported
      if (options.vibrate && 'vibrate' in navigator) {
        (navigator as any).vibrate(options.vibrate);
      }
      
      return null; // Service worker notifications don't return a Notification object
    }

    // Fallback to regular notification for desktop
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon.png',
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? true,
      silent: options.silent ?? false,
    });

    console.log('Notification shown via Notification API');

    // Vibrate if supported and pattern provided
    if (options.vibrate && 'vibrate' in navigator) {
      (navigator as any).vibrate(options.vibrate);
    }

    return notification;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
}

/**
 * Show notification for new order
 */
export async function notifyNewOrder(orderNumber: string, tableNumber: string): Promise<void> {
  await showNotification({
    title: '🔔 New Order!',
    body: `Order #${orderNumber} - Table ${tableNumber}`,
    tag: `order-${orderNumber}`,
    vibrate: [200, 100, 200, 100, 200],
  });
}

/**
 * Show notification for order update
 */
export async function notifyOrderUpdate(orderNumber: string, tableNumber: string, itemCount: number): Promise<void> {
  await showNotification({
    title: '📝 Order Updated',
    body: `Order #${orderNumber} - Table ${tableNumber} - ${itemCount} item(s) added`,
    tag: `order-${orderNumber}`,
    vibrate: [200, 100, 200],
  });
}

/**
 * Show notification for order status change
 */
export async function notifyOrderStatus(orderNumber: string, status: string): Promise<void> {
  const statusMessages: Record<string, string> = {
    confirmed: 'Order confirmed and being prepared',
    preparing: 'Order is being prepared in the kitchen',
    ready: 'Order is ready and will be served shortly',
    served: 'Order has been served. Enjoy your meal!',
    completed: 'Thank you for dining with us!',
  };

  const message = statusMessages[status] || `Order status: ${status}`;

  await showNotification({
    title: `Order #${orderNumber}`,
    body: message,
    tag: `order-${orderNumber}-status`,
    vibrate: [200],
  });
}

/**
 * Initialize notifications (request permission on first load)
 */
export async function initializeNotifications(): Promise<void> {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  // Register service worker if not already registered
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered for notifications');
    } catch (error) {
      console.error('Failed to register service worker:', error);
    }
  }

  // Request permission if not already granted or denied
  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }
}
