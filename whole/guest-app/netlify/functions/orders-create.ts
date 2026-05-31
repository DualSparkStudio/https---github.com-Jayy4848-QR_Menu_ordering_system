import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { generateOrderNumber, calculateOrderTotals } from '../../../shared/orderUtils';

// Cache invalidation helper
const invalidateCache = (tableId: string) => {
  // This would ideally use Redis or similar, but for now we'll rely on short TTLs
  console.log(`Cache invalidated for table: ${tableId}`);
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];
  const tableId = pathParts[pathParts.indexOf('tables') + 1];

  try {
    const dto = JSON.parse(event.body || '{}');

    // Fetch all required data in parallel
    const [table, restaurant, existingOrder, menuItems] = await Promise.all([
      prisma.table.findUnique({ where: { id: tableId } }),
      prisma.restaurant.findUnique({ where: { id: restaurantId } }),
      prisma.order.findFirst({
        where: {
          tableId,
          status: { in: ['pending', 'confirmed', 'preparing', 'ready'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.menuItem.findMany({
        where: { 
          id: { in: dto.items.map((i: any) => i.menuItemId) }, 
          restaurantId, 
          isAvailable: true 
        },
      }),
    ]);

    if (!table || table.restaurantId !== restaurantId) {
      return error('Table not found', 404);
    }
    if (!restaurant) return error('Restaurant not found', 404);
    if (!restaurant.isOpen) return error('Restaurant is currently closed', 400);
    if (menuItems.length !== dto.items.length) {
      return error('Some items are unavailable', 400);
    }

    if (existingOrder) {
      // Fetch existing order items to check for duplicates
      const existingOrderItems = await prisma.orderItem.findMany({
        where: { orderId: existingOrder.id },
      });

      // Add items to existing order - merge duplicates
      let additionalSubtotal = 0;
      const itemsToCreate: any[] = [];
      const itemsToUpdate: any[] = [];

      for (const item of dto.items) {
        const mi = menuItems.find((m: any) => m.id === item.menuItemId)!;
        const itemSubtotal = mi.basePrice * item.quantity;
        additionalSubtotal += itemSubtotal;

        // Normalize values for comparison
        const newVariants = item.selectedVariants ? JSON.stringify(item.selectedVariants) : null;
        const newInstructions = item.specialInstructions || null;

        // Check if this exact item already exists (same menuItemId and no special customizations)
        const existingItem = existingOrderItems.find((oi: any) => 
          oi.menuItemId === item.menuItemId &&
          (oi.selectedVariants === newVariants || (!oi.selectedVariants && !newVariants)) &&
          (oi.specialInstructions === newInstructions || (!oi.specialInstructions && !newInstructions))
        );

        if (existingItem) {
          // Update existing item quantity
          itemsToUpdate.push({
            id: existingItem.id,
            quantity: existingItem.quantity + item.quantity,
          });
        } else {
          // Create new item
          itemsToCreate.push({
            orderId: existingOrder.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: mi.basePrice,
            selectedVariants: newVariants,
            specialInstructions: newInstructions,
          });
        }
      }

      // Execute updates and creates
      await Promise.all([
        ...itemsToUpdate.map((item) =>
          prisma.orderItem.update({
            where: { id: item.id },
            data: { 
              quantity: item.quantity,
              updatedAt: new Date(), // Force update timestamp to show as "new"
            },
          })
        ),
        itemsToCreate.length > 0 ? prisma.orderItem.createMany({ data: itemsToCreate }) : Promise.resolve(),
      ]);

      const newSubtotal = existingOrder.subtotal + additionalSubtotal;
      const { taxAmount: newTaxAmount, serviceCharge: newServiceCharge, totalAmount: newTotalAmount } = calculateOrderTotals(
        newSubtotal,
        restaurant.taxPercentage,
        restaurant.serviceChargePercentage,
        existingOrder.discountAmount
      );

      const updatedOrder = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          serviceCharge: newServiceCharge,
          totalAmount: newTotalAmount,
        },
        include: { items: { include: { menuItem: true } }, table: true },
      });

      invalidateCache(tableId);
      return success(updatedOrder);
    }

    // Create new order
    let subtotal = 0;
    const orderItems = dto.items.map((item: any) => {
      const mi = menuItems.find((m: any) => m.id === item.menuItemId)!;
      subtotal += mi.basePrice * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: mi.basePrice,
        selectedVariants: item.selectedVariants ? JSON.stringify(item.selectedVariants) : null,
        specialInstructions: item.specialInstructions,
      };
    });

    let discountAmount = dto.discountAmount || 0;
    let couponId: string | undefined;
    if (dto.couponCode && dto.sessionId) {
      const coupon = await prisma.coupon.findFirst({
        where: { restaurantId, code: dto.couponCode, isActive: true },
      });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          // Check if this sessionId has already used this coupon in any order
          const existingCouponUsage = await prisma.order.findFirst({
            where: {
              tableId,
              couponCode: dto.couponCode,
              status: { not: 'cancelled' },
            },
          });
          
          if (existingCouponUsage) {
            // User already used this coupon
            return error('You have already used this coupon', 400);
          }
          
          if (subtotal >= coupon.minOrderValue) {
            discountAmount = coupon.discountType === 'percentage'
              ? Math.min(subtotal * coupon.discountValue / 100, coupon.maxDiscount || Infinity)
              : coupon.discountValue;
            couponId = coupon.id;
          }
        }
      }
    }

    const { taxAmount, serviceCharge, totalAmount } = calculateOrderTotals(
      subtotal,
      restaurant.taxPercentage,
      restaurant.serviceChargePercentage,
      discountAmount
    );
    const orderNumber = generateOrderNumber();

    // Create order and update table/coupon in parallel
    const [order] = await Promise.all([
      prisma.order.create({
        data: {
          restaurantId, tableId, orderNumber,
          guestName: dto.guestName, guestPhone: dto.guestPhone, guestCount: dto.guestCount || 1,
          specialInstructions: dto.specialInstructions,
          subtotal, taxAmount, serviceCharge, discountAmount, totalAmount,
          couponId, couponCode: dto.couponCode,
          items: { create: orderItems },
        },
        include: { items: { include: { menuItem: true } }, table: true },
      }),
      prisma.table.update({ where: { id: tableId }, data: { status: 'occupied' } }),
      couponId ? prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }) : Promise.resolve(),
    ]);

    invalidateCache(tableId);
    return success(order, 201);
  } catch (err: any) {
    console.error('Create order error:', err);
    return error(err.message || 'Failed to create order', 500);
  }
};
