import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private configService: ConfigService, private prisma: PrismaService) {}

  async sendOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, table: true },
    });
    if (!order) return;

    const message = `Your order #${order.orderNumber} has been placed at ${order.restaurant.name} (Table ${order.table.tableNumber}). Total: ${order.restaurant.currency} ${order.totalAmount.toFixed(2)}`;

    if (order.guestPhone) {
      await this.sendWhatsApp(order.guestPhone, message);
    }

    await this.prisma.notification.create({
      data: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        type: 'order_placed',
        title: 'Order Confirmed',
        message,
        recipientPhone: order.guestPhone || undefined,
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  async sendOrderUpdate(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, table: true },
    });
    if (!order) return;

    const message = `Your order #${order.orderNumber} has been updated at ${order.restaurant.name} (Table ${order.table.tableNumber}). New Total: ${order.restaurant.currency} ${order.totalAmount.toFixed(2)}`;

    if (order.guestPhone) {
      await this.sendWhatsApp(order.guestPhone, message);
    }

    await this.prisma.notification.create({
      data: {
        restaurantId: order.restaurantId,
        orderId: order.id,
        type: 'order_updated',
        title: 'Order Updated',
        message,
        recipientPhone: order.guestPhone || undefined,
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  async sendOrderStatusUpdate(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order || !order.guestPhone) return;

    const statusMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      preparing: 'Your order is being prepared in the kitchen.',
      ready: 'Your order is ready and will be served shortly.',
      served: 'Your order has been served. Enjoy your meal!',
      completed: 'Thank you for dining with us! We hope to see you again.',
    };

    const message = statusMessages[status];
    if (message) await this.sendWhatsApp(order.guestPhone, `Order #${order.orderNumber}: ${message}`);
  }

  private async sendWhatsApp(phone: string, message: string) {
    const token = this.configService.get('WHATSAPP_BUSINESS_TOKEN');
    const phoneId = this.configService.get('WHATSAPP_PHONE_ID');
    if (!token || !phoneId) return;

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message } },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error('WhatsApp send failed:', err);
    }
  }
}
