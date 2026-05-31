"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderAge = getOrderAge;
exports.isDelayedOrder = isDelayedOrder;
exports.isNewOrder = isNewOrder;
exports.hasRecentItems = hasRecentItems;
exports.getOrderCardColor = getOrderCardColor;
exports.calculateOrderTotals = calculateOrderTotals;
exports.generateOrderNumber = generateOrderNumber;
exports.calculateDiscount = calculateDiscount;
exports.getItemStatusFromOrderStatus = getItemStatusFromOrderStatus;
exports.formatCurrency = formatCurrency;
exports.calculateEstimatedTime = calculateEstimatedTime;
exports.isActiveOrder = isActiveOrder;
exports.getActiveOrdersCount = getActiveOrdersCount;
exports.sortOrdersByPriority = sortOrdersByPriority;
const uuid_1 = require("uuid");
const constants_1 = require("./constants");
/**
 * Calculate order age in minutes
 */
function getOrderAge(createdAt) {
    const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    return Math.floor((Date.now() - created.getTime()) / 60000);
}
/**
 * Check if order is delayed (>20 minutes old and still active)
 */
function isDelayedOrder(createdAt, status) {
    const age = getOrderAge(createdAt);
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
    return age > constants_1.TIME_CONSTANTS.DELAYED_ORDER_THRESHOLD && activeStatuses.includes(status);
}
/**
 * Check if order is new (<2 minutes old)
 */
function isNewOrder(createdAt) {
    return getOrderAge(createdAt) < constants_1.TIME_CONSTANTS.NEW_ORDER_THRESHOLD;
}
/**
 * Check if order has recently added items (<2 minutes)
 */
function hasRecentItems(order) {
    if (!order.items || !Array.isArray(order.items))
        return false;
    return order.items.some((item) => {
        if (!item.createdAt)
            return false;
        return getOrderAge(item.createdAt) < constants_1.TIME_CONSTANTS.RECENT_ITEM_THRESHOLD;
    });
}
/**
 * Get the appropriate card background color for an order
 */
function getOrderCardColor(order) {
    if (isDelayedOrder(order.createdAt, order.status)) {
        return constants_1.ORDER_CARD_COLORS.DELAYED;
    }
    if (isNewOrder(order.createdAt)) {
        return constants_1.ORDER_CARD_COLORS.NEW;
    }
    if (hasRecentItems(order)) {
        return constants_1.ORDER_CARD_COLORS.UPDATED;
    }
    return constants_1.ORDER_CARD_COLORS.DEFAULT;
}
function calculateOrderTotals(subtotal, taxPercentage, serviceChargePercentage, discountAmount = 0, cgstPercentage = 0, sgstPercentage = 0) {
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
function generateOrderNumber() {
    const timestamp = Date.now();
    const randomId = (0, uuid_1.v4)().substring(0, 6).toUpperCase();
    return `ORD-${timestamp}-${randomId}`;
}
function calculateDiscount(subtotal, coupon) {
    if (subtotal < coupon.minOrderValue) {
        return { discountAmount: 0, finalAmount: subtotal };
    }
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    }
    else {
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
function getItemStatusFromOrderStatus(orderStatus) {
    return constants_1.ORDER_TO_ITEM_STATUS[orderStatus] || 'pending';
}
/**
 * Format currency amount
 */
function formatCurrency(amount, currency = '₹') {
    return `${currency} ${amount.toFixed(2)}`;
}
/**
 * Calculate estimated preparation time
 */
function calculateEstimatedTime(items, pendingOrdersCount = 0) {
    // Base time: longest preparation time among items
    const maxPrepTime = Math.max(...items.map(item => item.preparationTime || 15), 15 // minimum 15 minutes
    );
    // Add 3 minutes per pending order (kitchen queue)
    const queueTime = pendingOrdersCount * 3;
    return Math.max(2, maxPrepTime + queueTime);
}
/**
 * Check if order is active (not completed or cancelled)
 */
function isActiveOrder(status) {
    return ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(status);
}
/**
 * Get active orders count
 */
function getActiveOrdersCount(orders) {
    return orders.filter(order => isActiveOrder(order.status)).length;
}
/**
 * Sort orders by priority (delayed first, then new, then by creation time)
 */
function sortOrdersByPriority(orders) {
    return [...orders].sort((a, b) => {
        // Delayed orders first
        const aDelayed = isDelayedOrder(a.createdAt, a.status);
        const bDelayed = isDelayedOrder(b.createdAt, b.status);
        if (aDelayed && !bDelayed)
            return -1;
        if (!aDelayed && bDelayed)
            return 1;
        // Then new orders
        const aNew = isNewOrder(a.createdAt);
        const bNew = isNewOrder(b.createdAt);
        if (aNew && !bNew)
            return -1;
        if (!aNew && bNew)
            return 1;
        // Then by creation time (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}
//# sourceMappingURL=orderUtils.js.map