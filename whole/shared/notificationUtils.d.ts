/**
 * Browser notification utilities
 */
/**
 * Request notification permission from the user
 */
export declare function requestNotificationPermission(): Promise<NotificationPermission>;
/**
 * Check if notifications are supported and permitted
 */
export declare function canShowNotifications(): boolean;
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
export declare function showNotification(options: NotificationOptions): Notification | null;
/**
 * Show notification for new order
 */
export declare function notifyNewOrder(orderNumber: string, tableNumber: string): void;
/**
 * Show notification for order update
 */
export declare function notifyOrderUpdate(orderNumber: string, tableNumber: string, itemCount: number): void;
/**
 * Show notification for order status change
 */
export declare function notifyOrderStatus(orderNumber: string, status: string): void;
/**
 * Initialize notifications (request permission on first load)
 */
export declare function initializeNotifications(): void;
//# sourceMappingURL=notificationUtils.d.ts.map