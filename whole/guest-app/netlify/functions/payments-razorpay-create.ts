import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  const pathParts = event.path.split('/');
  const orderId = pathParts[pathParts.length - 1];

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order) return error('Order not found', 404);

    const razorpayKey = process.env.RAZORPAY_KEY_ID || '';
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const isRazorpayLive = !!(razorpayKey && razorpayKey.startsWith('rzp_') && !razorpayKey.includes('test_key'));

    let razorpayOrderId: string;

    if (isRazorpayLive) {
      try {
        const response = await axios.post(
          'https://api.razorpay.com/v1/orders',
          {
            amount: Math.round(order.totalAmount * 100),
            currency: order.restaurant.currency,
            receipt: order.orderNumber,
          },
          { auth: { username: razorpayKey, password: razorpaySecret } },
        );
        razorpayOrderId = response.data.id;
      } catch (err: any) {
        console.error('Razorpay API error:', err?.response?.data || err.message);
        return error('Payment gateway error. Please try again.', 500);
      }
    } else {
      razorpayOrderId = `order_test_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
      console.warn(`[DEV] Using mock Razorpay order: ${razorpayOrderId}`);
    }

    const payment = await prisma.payment.create({
      data: {
        restaurantId: order.restaurantId,
        amount: order.totalAmount,
        currency: order.restaurant.currency,
        paymentMethod: 'razorpay',
        razorpayOrderId,
        status: 'pending',
      },
    });

    await prisma.order.update({ where: { id: orderId }, data: { paymentId: payment.id } });

    return success({
      paymentId: payment.id,
      razorpayOrderId,
      amount: order.totalAmount,
      currency: order.restaurant.currency,
      key: razorpayKey,
      isTestMode: !isRazorpayLive,
    });
  } catch (err: any) {
    console.error('Create Razorpay order error:', err);
    return error(err.message || 'Failed to create payment', 500);
  }
};
