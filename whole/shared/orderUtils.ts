import { v4 as uuidv4 } from 'uuid';
import { TIME_CONSTANTS, ORDER_CARD_COLORS, ORDER_TO_ITEM_STATUS } from './constants';

/**
 * Calculate order age in minutes
 */
export function getOrderAge(createdAt: Date | string): number {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return Math.floor((Date.now() - created.getTime()) / 60000);
}

/**
 * Check if order is delayed (>20 minutes old and still active)
 */
export function isDelayedOrder(createdAt: Date | string, status: string): boolean {
  const age = getOrderAge(createdAt);
  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
  return age > TIME_CONSTANTS.DELAYED_ORDER_THRESHOLD && activeStatuses.includes(status);
}

/**
 * Check if order is new (<2 minutes old)
 */
export function isNewOrder(createdAt: Date | string): boolean {
  return getOrderAge(createdAt) < TIME_CONSTANTS.NEW_ORDER_THRESHOLD;
}

/**
 * Check if order has recently added items (<2 minutes)
 */
export function hasRecentItems(order: any): boolean {
  if (!order.items || !Array.isArray(order.items)) return false;
  
  return order.items.some((item: any) => {
    if (!item.createdAt) return false;
    return getOrderAge(item.createdAt) < TIME_CONSTANTS.RECENT_ITEM_THRESHOLD;
  });
}

/**
 * Get the appropriate card background color for an order
 */
export function getOrderCardColor(order: any): string {
  if (isDelayedOrder(order.createdAt, order.status)) {
    return ORDER_CARD_COLORS.DELAYED;
  }
  if (isNewOrder(order.createdAt)) {
    return ORDER_CARD_COLORS.NEW;
  }
  if (hasRecentItems(order)) {
    return ORDER_CARD_COLORS.UPDATED;
  }
  return ORDER_CARD_COLORS.DEFAULT;
}

/**
 * Calculate order totals (tax, service charge, total)
 */
export interface OrderTotals {
  taxAmount: number;
  serviceCharge: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

export function calculateOrderTotals(
  subtotal: number,
  taxPercentage: number,
  serviceChargePercentage: number,
  discountAmount: number = 0,
  cgstPercentage: number = 0,
  sgstPercentage: number = 0
): OrderTotals {
  const taxAmount = (subtotal * taxPercentage) / 100;
  const serviceCharge = (subtotal * serviceChargePercentage) / 100;
  const cgstAmount = (subtotal * cgstPercentage) / 100;
  const sgstAmount = (subtotal * sgstPercentage) / 100;
  const totalAmount = subtotal + taxAmount + serviceCharge + cgstAmount + sgstAmount - discountAmount;
  
  return {
    taxAmount: Number(taxAmount.toFixed(2)),
    serviceCharge: Number(serviceCharge.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Generate unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 6).toUpperCase();
  return `ORD-${timestamp}-${randomId}`;
}

/**
 * Calculate discount amount based on coupon
 */
export interface DiscountCalculation {
  discountAmount: number;
  finalAmount: number;
}

export function calculateDiscount(
  subtotal: number,
  coupon: {
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
    minOrderValue: number;
  }
): DiscountCalculation {
  if (subtotal < coupon.minOrderValue) {
    return { discountAmount: 0, finalAmount: subtotal };
  }

  let discountAmount = 0;
  
  if (coupon.discountType === 'percentage') {
    discountAmount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  return {
    discountAmount: Number(discountAmount.toFixed(2)),
    finalAmount: Number((subtotal - discountAmount).toFixed(2)),
  };
}

/**
 * Get item status based on order status
 */
export function getItemStatusFromOrderStatus(orderStatus: string): string {
  return ORDER_TO_ITEM_STATUS[orderStatus] || 'pending';
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Calculate estimated preparation time
 */
export function calculateEstimatedTime(
  items: Array<{ preparationTime?: number }>,
  pendingOrdersCount: number = 0
): number {
  // Base time: longest preparation time among items
  const maxPrepTime = Math.max(
    ...items.map(item => item.preparationTime || 15),
    15 // minimum 15 minutes
  );
  
  // Add 3 minutes per pending order (kitchen queue)
  const queueTime = pendingOrdersCount * 3;
  
  return Math.max(2, maxPrepTime + queueTime);
}

/**
 * Check if order is active (not completed or cancelled)
 */
export function isActiveOrder(status: string): boolean {
  return ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(status);
}

/**
 * Get active orders count
 */
export function getActiveOrdersCount(orders: Array<{ status: string }>): number {
  return orders.filter(order => isActiveOrder(order.status)).length;
}

/**
 * Sort orders by priority (delayed first, then new, then by creation time)
 */
export function sortOrdersByPriority(orders: any[]): any[] {
  return [...orders].sort((a, b) => {
    // Delayed orders first
    const aDelayed = isDelayedOrder(a.createdAt, a.status);
    const bDelayed = isDelayedOrder(b.createdAt, b.status);
    if (aDelayed && !bDelayed) return -1;
    if (!aDelayed && bDelayed) return 1;
    
    // Then new orders
    const aNew = isNewOrder(a.createdAt);
    const bNew = isNewOrder(b.createdAt);
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    
    // Then by creation time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
