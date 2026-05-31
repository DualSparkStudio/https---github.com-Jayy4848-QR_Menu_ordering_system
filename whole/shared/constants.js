"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_CARD_BORDER_COLORS = exports.ORDER_CARD_COLORS = exports.TIME_CONSTANTS = exports.NOTIFICATION_TYPES = exports.ORDER_TO_ITEM_STATUS = exports.STATUS_NEXT_LABEL = exports.STATUS_NEXT = exports.FILTER_LABELS = exports.ORDER_FILTERS = exports.ITEM_STATUS_OPTIONS = exports.STATUS_OPTIONS = exports.STATUS_LABELS = exports.STATUS_COLORS = exports.ITEM_STATUSES = exports.ORDER_STATUSES = void 0;
// Order Status Constants
exports.ORDER_STATUSES = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};
// Item Status Constants
exports.ITEM_STATUSES = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
};
// Status Display Configuration
exports.STATUS_COLORS = {
    pending: 'text-yellow-600',
    confirmed: 'text-blue-600',
    preparing: 'text-orange-600',
    ready: 'text-green-600',
    served: 'text-purple-600',
    completed: 'text-gray-500',
    cancelled: 'text-red-500',
};
exports.STATUS_LABELS = {
    pending: '🕐 Pending',
    confirmed: '✓ Confirmed',
    preparing: '👨‍🍳 Cooking',
    ready: '🔔 Ready',
    served: '🍽️ Served',
    completed: '✅ Completed',
    cancelled: '✕ Cancelled',
};
exports.STATUS_OPTIONS = [
    { value: 'pending', label: '🕐 Pending' },
    { value: 'confirmed', label: '✓ Confirmed' },
    { value: 'preparing', label: '👨‍🍳 Cooking' },
    { value: 'ready', label: '🔔 Ready' },
    { value: 'served', label: '🍽️ Served' },
    { value: 'completed', label: '✅ Completed' },
    { value: 'cancelled', label: '✕ Cancelled' },
];
exports.ITEM_STATUS_OPTIONS = [
    { value: 'pending', label: '🕐 Pending' },
    { value: 'preparing', label: '👨‍🍳 Cooking' },
    { value: 'ready', label: '🔔 Ready' },
    { value: 'served', label: '🍽️ Served' },
];
// Filter Configuration
exports.ORDER_FILTERS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
exports.FILTER_LABELS = {
    '': 'All',
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Cooking',
    ready: 'Ready',
    served: 'Served',
    completed: 'Done',
    cancelled: 'Cancelled',
};
// Order Status Transitions
exports.STATUS_NEXT = {
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'served',
    served: 'completed',
};
exports.STATUS_NEXT_LABEL = {
    pending: '✓ Confirm',
    confirmed: '👨‍🍳 Cooking',
    preparing: '🔔 Ready',
    ready: '🍽️ Served',
    served: '✓ Complete',
};
// Order to Item Status Mapping
exports.ORDER_TO_ITEM_STATUS = {
    pending: 'pending',
    confirmed: 'pending',
    preparing: 'preparing',
    ready: 'ready',
    served: 'served',
    completed: 'served',
    cancelled: 'pending',
};
// Notification Types
exports.NOTIFICATION_TYPES = {
    ORDER_PLACED: 'order_placed',
    ORDER_UPDATED: 'order_updated',
    ORDER_STATUS: 'order_status',
};
// Time Constants (in minutes)
exports.TIME_CONSTANTS = {
    NEW_ORDER_THRESHOLD: 2,
    DELAYED_ORDER_THRESHOLD: 20,
    RECENT_ITEM_THRESHOLD: 2,
    POLLING_INTERVAL: 20000, // 20 seconds in milliseconds
};
// Card Colors for Order Highlighting
exports.ORDER_CARD_COLORS = {
    DELAYED: '#fecaca', // red-200
    NEW: '#bbf7d0', // green-200
    UPDATED: '#bfdbfe', // blue-200
    DEFAULT: 'transparent',
};
exports.ORDER_CARD_BORDER_COLORS = {
    DELAYED: '#fca5a5', // red-300
    NEW: '#86efac', // green-300
    UPDATED: '#93c5fd', // blue-300
    DEFAULT: '#e5e7eb', // gray-200
};
//# sourceMappingURL=constants.js.map