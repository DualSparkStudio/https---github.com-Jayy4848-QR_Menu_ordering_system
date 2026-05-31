/**
 * Calculate order age in minutes
 */
export declare function getOrderAge(createdAt: Date | string): number;
/**
 * Check if order is delayed (>20 minutes old and still active)
 */
export declare function isDelayedOrder(createdAt: Date | string, status: string): boolean;
/**
 * Check if order is new (<2 minutes old)
 */
export declare function isNewOrder(createdAt: Date | string): boolean;
/**
 * Check if order has recently added items (<2 minutes)
 */
export declare function hasRecentItems(order: any): boolean;
/**
 * Get the appropriate card background color for an order
 */
export declare function getOrderCardColor(order: any): string;
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
export declare function calculateOrderTotals(subtotal: number, taxPercentage: number, serviceChargePercentage: number, discountAmount?: number, cgstPercentage?: number, sgstPercentage?: number): OrderTotals;
/**
 * Generate unique order number
 */
export declare function generateOrderNumber(): string;
/**
 * Calculate discount amount based on coupon
 */
export interface DiscountCalculation {
    discountAmount: number;
    finalAmount: number;
}
export declare function calculateDiscount(subtotal: number, coupon: {
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
    minOrderValue: number;
}): DiscountCalculation;
/**
 * Get item status based on order status
 */
export declare function getItemStatusFromOrderStatus(orderStatus: string): string;
/**
 * Format currency amount
 */
export declare function formatCurrency(amount: number, currency?: string): string;
/**
 * Calculate estimated preparation time
 */
export declare function calculateEstimatedTime(items: Array<{
    preparationTime?: number;
}>, pendingOrdersCount?: number): number;
/**
 * Check if order is active (not completed or cancelled)
 */
export declare function isActiveOrder(status: string): boolean;
/**
 * Get active orders count
 */
export declare function getActiveOrdersCount(orders: Array<{
    status: string;
}>): number;
/**
 * Sort orders by priority (delayed first, then new, then by creation time)
 */
export declare function sortOrdersByPriority(orders: any[]): any[];
//# sourceMappingURL=orderUtils.d.ts.map