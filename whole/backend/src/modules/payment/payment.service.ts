import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrderService } from '../order/order.service';
import axios from 'axios';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
  ) {}

  private get razorpayKey() { return this.configService.get<string>('RAZORPAY_KEY_ID') || ''; }
  private get razorpaySecret() { return this.configService.get<string>('RAZORPAY_KEY_SECRET') || ''; }

  // Returns true when real Razorpay credentials are configured
  private get isRazorpayLive(): boolean {
    const key = this.razorpayKey;
    return !!(key && key.startsWith('rzp_') && !key.includes('test_key'));
  }

  async createRazorpayOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    let razorpayOrderId: string;

    if (this.isRazorpayLive) {
      // ── Real Razorpay API call ──────────────────────────
      try {
        const response = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount: Math.round(order.totalAmount * 100),
            currency: order.restaurant.currency,
            receipt: order.orderNumber,
          },
          { auth: { username: this.razorpayKey, password: this.razorpaySecret } },
        );
        razorpayOrderId = response.data.id;
      } catch (err: any) {
        this.logger.error('Razorpay API error:', err?.response?.data || err.message);
        throw new BadRequestException('Payment gateway error. Please try again.');
      }
    } else {
      // ── Test / dev mode: generate a mock order ID ──────
      razorpayOrderId = `order_test_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
      this.logger.warn(`[DEV] Using mock Razorpay order: ${razorpayOrderId}`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        restaurantId: order.restaurantId,
        amount: order.totalAmount,
        currency: order.restaurant.currency,
        paymentMethod: 'razorpay',
        razorpayOrderId,
        status: 'pending',
      },
    });

    await this.prisma.order.update({ where: { id: orderId }, data: { paymentId: payment.id } });

    return {
      paymentId: payment.id,
      razorpayOrderId,
      amount: order.totalAmount,
      currency: order.restaurant.currency,
      key: this.razorpayKey,
      isTestMode: !this.isRazorpayLive,
    };
  }

  async verifyRazorpayPayment(paymentId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (this.isRazorpayLive) {
      // ── Real signature verification ─────────────────────
      const body = `${payment.razorpayOrderId}|${razorpayPaymentId}`;
      const expected = crypto.createHmac('sha256', this.razorpaySecret).update(body).digest('hex');
      if (expected !== razorpaySignature) throw new BadRequestException('Invalid payment signature');
    } else {
      // ── Dev mode: accept any signature ──────────────────
      this.logger.warn('[DEV] Skipping Razorpay signature verification in test mode');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'completed', razorpayPaymentId, completedAt: new Date() },
    });

    // Mark order as paid + confirmed
    const orders = await this.prisma.order.findMany({ where: { paymentId } });
    for (const order of orders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'completed', status: 'confirmed' },
      });

      // Check if order is completed and free table if needed
      if (order.status === 'completed') {
        await this.orderService.checkAndFreeTable(order.tableId);
      }
    }

    return updated;
  }

  async recordCashPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order) throw new NotFoundException('Order not found');

    const payment = await this.prisma.payment.create({
      data: {
        restaurantId: order.restaurantId,
        amount: order.totalAmount,
        currency: order.restaurant.currency,
        paymentMethod: 'cash',
        status: 'completed',
        completedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentId: payment.id, paymentStatus: 'completed', status: 'completed' },
    });

    // Check and free table if all orders are completed
    await this.orderService.checkAndFreeTable(order.tableId);

    return payment;
  }
}
