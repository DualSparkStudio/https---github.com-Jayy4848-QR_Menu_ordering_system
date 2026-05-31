import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { NotificationService } from '../notification/notification.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { generateOrderNumber, calculateOrderTotals, getItemStatusFromOrderStatus } from '../../utils/order.utils';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notificationService: NotificationService,
    private wsGateway: WebSocketGateway,
  ) {}

  async createOrder(restaurantId: string, tableId: string, dto: CreateOrderDto) {
    const [table, restaurant] = await Promise.all([
      this.prisma.table.findUnique({ where: { id: tableId } }),
      this.prisma.restaurant.findUnique({ where: { id: restaurantId } }),
    ]);

    if (!table || table.restaurantId !== restaurantId) throw new NotFoundException('Table not found');
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (!restaurant.isOpen) throw new BadRequestException('Restaurant is currently closed');

    // Check for existing active order on this table AND session
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        tableId,
        sessionId: dto.sessionId || null,
        status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If active order exists, add items to it instead of creating new order
    if (existingOrder) {
      return this.addItemsToOrder(existingOrder.id, dto);
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: dto.items.map((i) => i.menuItemId) }, restaurantId, isAvailable: true },
    });

    if (menuItems.length !== dto.items.length) throw new BadRequestException('Some items are unavailable');

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
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

    // Apply coupon
    let discountAmount = dto.discountAmount || 0;
    let couponId: string | undefined;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: { restaurantId, code: dto.couponCode, isActive: true },
      });
      if (coupon) {
        if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
          if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            if (subtotal >= coupon.minOrderValue) {
              discountAmount = coupon.discountType === 'percentage'
                ? Math.min(subtotal * coupon.discountValue / 100, coupon.maxDiscount || Infinity)
                : coupon.discountValue;
              couponId = coupon.id;
            }
          }
        }
      }
    }

    const { taxAmount, serviceCharge, cgstAmount, sgstAmount, totalAmount } = calculateOrderTotals(
      subtotal,
      restaurant.taxPercentage,
      restaurant.serviceChargePercentage,
      discountAmount,
      restaurant.cgstPercentage ?? 0,
      restaurant.sgstPercentage ?? 0
    );
    const orderNumber = generateOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        restaurantId, tableId, sessionId: dto.sessionId, orderNumber,
        guestName: dto.guestName, guestPhone: dto.guestPhone, guestCount: dto.guestCount || 1,
        specialInstructions: dto.specialInstructions,
        subtotal, taxAmount, serviceCharge, cgstAmount, sgstAmount, discountAmount, totalAmount,
        couponId, couponCode: dto.couponCode,
        items: { create: orderItems },
      },
      include: { items: { include: { menuItem: true } }, table: true },
    });

    // Update coupon usage
    if (couponId) {
      await this.prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    // Update table status
    await this.prisma.table.update({ where: { id: tableId }, data: { status: 'occupied' } });

    // Cache order
    await this.redis.set(`order:${order.id}`, JSON.stringify(order), 86400);

    // Publish event via Redis (for other services)
    await this.redis.publish(`restaurant:${restaurantId}`, JSON.stringify({ event: 'order_placed', data: order }));

    // Broadcast directly via WebSocket to connected admin clients
    this.wsGateway.broadcast(restaurantId, 'order_placed', order);
    this.logger.log(`[Notification] order_placed broadcasted for order ${order.orderNumber}`);

    // Send notification immediately (non-blocking)
    this.notificationService.sendOrderConfirmation(order.id).catch(err => 
      this.logger.error('Failed to send order confirmation notification', err)
    );

    return order;
  }

  async addItemsToOrder(orderId: string, dto: CreateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, restaurant: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (!['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status)) {
      throw new BadRequestException('Cannot add items to completed order');
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: dto.items.map((i) => i.menuItemId) }, restaurantId: order.restaurantId, isAvailable: true },
    });

    if (menuItems.length !== dto.items.length) throw new BadRequestException('Some items are unavailable');

    // ALWAYS create new OrderItem records for newly added items
    // This allows tracking which items are new vs already served/completed
    let additionalSubtotal = 0;
    const itemsToCreate: Array<any> = [];

    for (const item of dto.items) {
      const mi = menuItems.find((m: any) => m.id === item.menuItemId)!;
      additionalSubtotal += mi.basePrice * item.quantity;

      // Always create new OrderItem record with status='pending'
      // This way admin can see which items are new additions
      itemsToCreate.push({
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: mi.basePrice,
        status: 'pending', // New items always start as pending
        selectedVariants: item.selectedVariants ? JSON.stringify(item.selectedVariants) : null,
        specialInstructions: item.specialInstructions,
      });
    }

    // Create new items
    await this.prisma.orderItem.createMany({ data: itemsToCreate });

    // Recalculate totals
    const newSubtotal = order.subtotal + additionalSubtotal;
    const { taxAmount: newTaxAmount, serviceCharge: newServiceCharge, cgstAmount: newCgstAmount, sgstAmount: newSgstAmount, totalAmount: newTotalAmount } = calculateOrderTotals(
      newSubtotal,
      order.restaurant.taxPercentage,
      order.restaurant.serviceChargePercentage,
      order.discountAmount,
      order.restaurant.cgstPercentage ?? 0,
      order.restaurant.sgstPercentage ?? 0
    );

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        serviceCharge: newServiceCharge,
        cgstAmount: newCgstAmount,
        sgstAmount: newSgstAmount,
        totalAmount: newTotalAmount,
      },
      include: { items: { include: { menuItem: true } }, table: true },
    });

    // Publish event via Redis
    await this.redis.publish(`restaurant:${order.restaurantId}`, JSON.stringify({ event: 'order_updated', data: updatedOrder }));

    // Broadcast directly via WebSocket to connected admin clients
    this.wsGateway.broadcast(order.restaurantId, 'order_updated', updatedOrder);
    this.logger.log(`[Notification] order_updated broadcasted for order ${updatedOrder.orderNumber}`);

    // Send notification for items added to existing order
    this.notificationService.sendOrderUpdate(updatedOrder.id).catch(err => 
      this.logger.error('Failed to send order update notification', err)
    );

    return updatedOrder;
  }

  async findAll(restaurantId: string, filters?: { status?: string; tableId?: string; date?: string }) {
    const where: any = { restaurantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.tableId) where.tableId = filters.tableId;
    if (filters?.date) {
      const d = new Date(filters.date);
      where.createdAt = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: { select: { id: true, name: true, image: true } } } },
        table: { select: { id: true, tableNumber: true, section: true } },
        payment: { select: { id: true, status: true, paymentMethod: true } },
        restaurant: { select: { id: true, name: true, address: true, phone: true, email: true, taxPercentage: true, serviceChargePercentage: true, cgstPercentage: true, sgstPercentage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { include: { variants: true } } } },
        table: true,
        payment: true,
        review: true,
        restaurant: { select: { id: true, name: true, taxPercentage: true, serviceChargePercentage: true, cgstPercentage: true, sgstPercentage: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    
    // Calculate estimated time
    const estimatedTime = await this.calculateEstimatedTime(order);
    return { ...order, estimatedTime };
  }

  private async calculateEstimatedTime(order: any): Promise<number> {
    // Base time: longest preparation time among items
    const maxPrepTime = Math.max(...order.items.map((item: any) => item.menuItem?.preparationTime || 15));
    
    // Kitchen load: count pending orders before this one
    const pendingOrders = await this.prisma.order.count({
      where: {
        restaurantId: order.restaurantId,
        status: { in: ['pending', 'confirmed', 'preparing'] },
        createdAt: { lt: order.createdAt },
      },
    });

    // Add 3 minutes per pending order (kitchen queue)
    const queueTime = pendingOrders * 3;
    
    // Status-based adjustment
    const statusAdjustment: Record<string, number> = {
      pending: 0,
      confirmed: -5,
      preparing: -10,
      ready: -maxPrepTime,
      served: 0,
      completed: 0,
      cancelled: 0,
    };

    const adjustment = statusAdjustment[order.status] || 0;
    const totalTime = Math.max(2, maxPrepTime + queueTime + adjustment);
    
    return totalTime;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findById(id);

    const updates: any = { status: dto.status };
    if (dto.status === 'served') updates.servedAt = new Date();
    if (dto.status === 'completed') updates.completedAt = new Date();
    if (dto.status === 'cancelled') {
      updates.cancelledAt = new Date();
      // Free up table if no other active orders
      const activeOrders = await this.prisma.order.count({
        where: { tableId: order.tableId, status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] } },
      });
      if (activeOrders <= 1) {
        await this.prisma.table.update({ where: { id: order.tableId }, data: { status: 'available' } });
      }
    }

    // Update order status
    const updated = await this.prisma.order.update({ where: { id }, data: updates });

    // Update all items to match the order status
    const itemStatus = getItemStatusFromOrderStatus(dto.status);
    await this.prisma.orderItem.updateMany({
      where: { orderId: id },
      data: { status: itemStatus },
    });

    // Check if order is completed and paid, then free the table
    if (dto.status === 'completed' && updated.paymentStatus === 'completed') {
      await this.checkAndFreeTable(order.tableId);
    }

    await this.redis.publish(`restaurant:${order.restaurantId}`, JSON.stringify({ event: 'order_updated', data: updated }));

    // Send status update notification immediately (non-blocking)
    this.notificationService.sendOrderStatusUpdate(id, dto.status).catch(err => 
      this.logger.error('Failed to send order status notification', err)
    );

    return updated;
  }

  async getActiveOrdersForTable(tableId: string, sessionId?: string) {
    const where: any = { 
      tableId, 
      status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] } 
    };
    
    // If sessionId provided, filter by it
    if (sessionId) {
      where.sessionId = sessionId;
    }
    
    return this.prisma.order.findMany({
      where,
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllOrdersForTable(tableId: string, sessionId?: string) {
    const where: any = { tableId };
    
    // If sessionId provided, filter by it
    if (sessionId) {
      where.sessionId = sessionId;
    }
    
    return this.prisma.order.findMany({
      where,
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkAndFreeTable(tableId: string) {
    const activeOrders = await this.prisma.order.count({
      where: {
        tableId,
        status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] },
      },
    });

    if (activeOrders === 0) {
      await this.prisma.table.update({
        where: { id: tableId },
        data: { status: 'available' },
      });
      return { cleared: true, message: 'Table is now available' };
    }

    return { cleared: false, message: 'Table still has active orders' };
  }

  async markAsPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: { table: true }
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'completed' },
    });

    // Check if table can be freed
    if (updated.status === 'completed') {
      await this.checkAndFreeTable(order.tableId);
    }

    // Publish event to notify guest app to clear cart and redirect
    await this.redis.publish(`table:${order.tableId}`, JSON.stringify({ 
      event: 'payment_completed', 
      data: { orderId, tableId: order.tableId } 
    }));

    return updated;
  }

  async updateItemStatus(itemId: string, status: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: { include: { restaurant: true } } },
    });

    if (!item) throw new NotFoundException('Order item not found');

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Publish event
    await this.redis.publish(`restaurant:${item.order.restaurantId}`, JSON.stringify({ 
      event: 'item_updated', 
      data: { itemId, orderId: item.orderId, status } 
    }));

    return updated;
  }

  async autoReleaseTables(restaurantId: string) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    // Find orders that are:
    // 1. Older than 2 hours
    // 2. Not completed
    // 3. Not paid (paymentStatus !== 'completed')
    const staleOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { lt: twoHoursAgo },
        status: { notIn: ['completed', 'cancelled'] },
        paymentStatus: { not: 'completed' },
      },
      include: { table: true },
    });
    
    const releasedTables: string[] = [];
    
    for (const order of staleOrders) {
      // Check if this table has any other active orders
      const activeOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          id: { not: order.id },
          status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] },
        },
      });
      
      // If no other active orders, release the table
      if (activeOrders === 0) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'available' },
        });
        releasedTables.push(order.table.tableNumber);
        
        this.logger.log(`Auto-released table ${order.table.tableNumber} (order ${order.orderNumber} older than 2 hours and unpaid)`);
      }
    }
    
    return { 
      message: `Released ${releasedTables.length} tables`,
      releasedTables,
      staleOrdersCount: staleOrders.length,
    };
  }
}
