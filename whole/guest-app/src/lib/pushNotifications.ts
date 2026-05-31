// Push Notification Service
// Handles Web Push API for background notifications

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'GENERATE_THIS';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      // Wait for service worker to be ready (active)
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribe();
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  private async subscribe(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(this.subscription);
      }

      console.log('Push subscription active');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const userType = this.getUserType();
      const userId = this.getUserId();
      
      // Get restaurantId for admin or tableId for guest
      let restaurantId, tableId;
      if (userType === 'admin') {
        const stored = localStorage.getItem('admin-auth');
        if (stored) {
          const data = JSON.parse(stored);
          restaurantId = data.staff?.restaurantId;
        }
      } else {
        const cartStore = localStorage.getItem('cart-storage');
        if (cartStore) {
          const data = JSON.parse(cartStore);
          tableId = data.state?.tableId;
        }
      }
      
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userType,
          userId,
          restaurantId,
          tableId,
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  // Show local notification (for foreground)
  showNotification(title: string, options?: NotificationOptions): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      if (this.registration) {
        // Use service worker notification (works in background)
        this.registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          tag: 'order-notification',
          renotify: true,
          requireInteraction: true,
          ...options,
        } as NotificationOptions);
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icon-192x192.png',
          ...options,
        } as NotificationOptions);
      }

      // Play sound
      this.playNotificationSound();
    }
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors (user might not have interacted with page yet)
      });
    } catch (error) {
      // Ignore errors
    }
  }

  // Get user type (admin or guest)
  private getUserType(): string {
    if (typeof window === 'undefined') return 'guest';
    const path = window.location.pathname;
    return path.includes('/admin') ? 'admin' : 'guest';
  }

  // Get user ID
  private getUserId(): string {
    if (typeof window === 'undefined') return '';
    
    // For admin, get from localStorage
    if (this.getUserType() === 'admin') {
      const stored = localStorage.getItem('admin-auth');
      if (stored) {
        const data = JSON.parse(stored);
        return data.staff?.id || '';
      }
    }
    
    // For guest, get session ID from cart store
    const cartStore = localStorage.getItem('cart-storage');
    if (cartStore) {
      const data = JSON.parse(cartStore);
      return data.state?.sessionId || '';
    }
    
    return '';
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationService.getInstance();
