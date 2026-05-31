"use strict";
/**
 * Browser notification utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestNotificationPermission = requestNotificationPermission;
exports.canShowNotifications = canShowNotifications;
exports.showNotification = showNotification;
exports.notifyNewOrder = notifyNewOrder;
exports.notifyOrderUpdate = notifyOrderUpdate;
exports.notifyOrderStatus = notifyOrderStatus;
exports.initializeNotifications = initializeNotifications;
/**
 * Request notification permission from the user
 */
async function requestNotificationPermission() {
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
function canShowNotifications() {
    return ('Notification' in window &&
        Notification.permission === 'granted');
}
function showNotification(options) {
    if (!canShowNotifications()) {
        return null;
    }
    const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon.png',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? true,
        silent: options.silent ?? false,
    });
    // Vibrate if supported and pattern provided
    if (options.vibrate && 'vibrate' in navigator) {
        navigator.vibrate(options.vibrate);
    }
    return notification;
}
/**
 * Show notification for new order
 */
function notifyNewOrder(orderNumber, tableNumber) {
    showNotification({
        title: '🔔 New Order!',
        body: `Order #${orderNumber} - Table ${tableNumber}`,
        tag: `order-${orderNumber}`,
        vibrate: [200, 100, 200, 100, 200],
    });
}
/**
 * Show notification for order update
 */
function notifyOrderUpdate(orderNumber, tableNumber, itemCount) {
    showNotification({
        title: '📝 Order Updated',
        body: `Order #${orderNumber} - Table ${tableNumber} - ${itemCount} item(s) added`,
        tag: `order-${orderNumber}`,
        vibrate: [200, 100, 200],
    });
}
/**
 * Show notification for order status change
 */
function notifyOrderStatus(orderNumber, status) {
    const statusMessages = {
        confirmed: 'Order confirmed and being prepared',
        preparing: 'Order is being prepared in the kitchen',
        ready: 'Order is ready and will be served shortly',
        served: 'Order has been served. Enjoy your meal!',
        completed: 'Thank you for dining with us!',
    };
    const message = statusMessages[status] || `Order status: ${status}`;
    showNotification({
        title: `Order #${orderNumber}`,
        body: message,
        tag: `order-${orderNumber}-status`,
        vibrate: [200],
    });
}
/**
 * Initialize notifications (request permission on first load)
 */
function initializeNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission();
    }
}
//# sourceMappingURL=notificationUtils.js.map