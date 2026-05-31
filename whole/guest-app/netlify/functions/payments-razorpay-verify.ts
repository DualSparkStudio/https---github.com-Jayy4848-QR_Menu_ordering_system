import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import * as crypto from 'crypto';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    const { paymentId, razorpayPaymentId, razorpaySignature } = JSON.parse(event.body || '{}');

    if (!paymentId || !razorpayPaymentId || !razorpaySignature) {
      return error('Missing required fields', 400);
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return error('Payment not found', 404);

    const razorpayKey = process.env.RAZORPAY_KEY_ID || '';
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const isRazorpayLive = !!(razorpayKey && razorpayKey.startsWith('rzp_') && !razorpayKey.includes('test_key'));

    if (isRazorpayLive) {
      const body = `${payment.razorpayOrderId}|${razorpayPaymentId}`;
      const expected = crypto.createHmac('sha256', razorpaySecret).update(body).digest('hex');
      if (expected !== razorpaySignature) {
        return error('Invalid payment signature', 400);
      }
    } else {
      console.warn('[DEV] Skipping Razorpay signature verification in test mode');
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'completed', razorpayPaymentId, completedAt: new Date() },
    });

    // Mark order as paid + confirmed
    const orders = await prisma.order.findMany({ where: { paymentId } });
    for (const order of orders) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'completed', status: 'confirmed' },
      });

      // Check if order is completed and free table if needed
      if (order.status === 'completed') {
        const activeOrders = await prisma.order.count({
          where: { tableId: order.tableId, status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] } },
        });
        if (activeOrders === 0) {
          await prisma.table.update({ where: { id: order.tableId }, data: { status: 'available' } });
        }
      }
    }

    return success(updated);
  } catch (err: any) {
    console.error('Verify Razorpay payment error:', err);
    return error(err.message || 'Failed to verify payment', 500);
  }
};
