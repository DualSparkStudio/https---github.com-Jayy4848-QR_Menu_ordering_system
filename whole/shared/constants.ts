// Order Status Constants
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

// Item Status Constants
export const ITEM_STATUSES = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
} as const;

export type ItemStatus = typeof ITEM_STATUSES[keyof typeof ITEM_STATUSES];

// Status Display Configuration
export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  confirmed: 'text-blue-600',
  preparing: 'text-orange-600',
  ready: 'text-green-600',
  served: 'text-purple-600',
  completed: 'text-gray-500',
  cancelled: 'text-red-500',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: '🕐 Pending',
  confirmed: '✓ Confirmed',
  preparing: '👨‍🍳 Cooking',
  ready: '🔔 Ready',
  served: '🍽️ Served',
  completed: '✅ Completed',
  cancelled: '✕ Cancelled',
};

export const STATUS_OPTIONS = [
  { value: 'pending', label: '🕐 Pending' },
  { value: 'confirmed', label: '✓ Confirmed' },
  { value: 'preparing', label: '👨‍🍳 Cooking' },
  { value: 'ready', label: '🔔 Ready' },
  { value: 'served', label: '🍽️ Served' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'cancelled', label: '✕ Cancelled' },
];

export const ITEM_STATUS_OPTIONS = [
  { value: 'pending', label: '🕐 Pending' },
  { value: 'preparing', label: '👨‍🍳 Cooking' },
  { value: 'ready', label: '🔔 Ready' },
  { value: 'served', label: '🍽️ Served' },
];

// Filter Configuration
export const ORDER_FILTERS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

export const FILTER_LABELS: Record<string, string> = {
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
export const STATUS_NEXT: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: 'completed',
};

export const STATUS_NEXT_LABEL: Record<string, string> = {
  pending: '✓ Confirm',
  confirmed: '👨‍🍳 Cooking',
  preparing: '🔔 Ready',
  ready: '🍽️ Served',
  served: '✓ Complete',
};

// Order to Item Status Mapping
export const ORDER_TO_ITEM_STATUS: Record<string, string> = {
  pending: 'pending',
  confirmed: 'pending',
  preparing: 'preparing',
  ready: 'ready',
  served: 'served',
  completed: 'served',
  cancelled: 'pending',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_UPDATED: 'order_updated',
  ORDER_STATUS: 'order_status',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Time Constants (in minutes)
export const TIME_CONSTANTS = {
  NEW_ORDER_THRESHOLD: 2,
  DELAYED_ORDER_THRESHOLD: 20,
  RECENT_ITEM_THRESHOLD: 2,
  POLLING_INTERVAL: 10000, // 10 seconds in milliseconds (reduced from 20 for faster updates)
};

// Card Colors for Order Highlighting
export const ORDER_CARD_COLORS = {
  DELAYED: '#fecaca', // red-200
  NEW: '#bbf7d0', // green-200
  UPDATED: '#bfdbfe', // blue-200
  DEFAULT: 'transparent',
};

export const ORDER_CARD_BORDER_COLORS = {
  DELAYED: '#fca5a5', // red-300
  NEW: '#86efac', // green-300
  UPDATED: '#93c5fd', // blue-300
  DEFAULT: '#e5e7eb', // gray-200
};
