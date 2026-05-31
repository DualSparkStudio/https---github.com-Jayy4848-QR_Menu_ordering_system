// Custom Service Worker for Push Notifications
// This extends the next-pwa service worker

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: true,
    tag: data.tag || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listen for notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Listen for background sync (for offline support)
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Sync pending orders when back online
  try {
    const cache = await caches.open('orders-cache');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        // Re-send the request
        await fetch(request);
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Failed to sync orders:', error);
  }
}
