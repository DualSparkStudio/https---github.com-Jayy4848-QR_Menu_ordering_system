import { Handler } from '@netlify/functions';
import { withPrisma } from './lib/withPrisma';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';

const handlerImpl: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'GET') {
    return error('Method not allowed', 405);
  }

  const pathParts = event.path.split('/');
  const orderId = pathParts[pathParts.length - 1];

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: { include: { variants: true } } } },
        table: true,
        payment: true,
        review: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            taxPercentage: true,
            serviceChargePercentage: true,
          },
        },
      },
    });

    if (!order) return error('Order not found', 404);

    // Calculate estimated time
    const maxPrepTime = Math.max(...order.items.map((item: any) => item.menuItem?.preparationTime || 15));
    const pendingOrders = await prisma.order.count({
      where: {
        restaurantId: order.restaurantId,
        status: { in: ['pending', 'confirmed', 'preparing'] },
        createdAt: { lt: order.createdAt },
      },
    });

    const queueTime = pendingOrders * 3;
    const statusAdjustment: Record<string, number> = {
      pending: 0, confirmed: -5, preparing: -10, ready: -maxPrepTime,
      served: 0, completed: 0, cancelled: 0,
    };
    const adjustment = statusAdjustment[order.status] || 0;
    const estimatedTime = Math.max(2, maxPrepTime + queueTime + adjustment);

    return success({ ...order, estimatedTime });
  } catch (err: any) {
    console.error('Get order error:', err);
    return error(err.message || 'Failed to fetch order', 500);
  }
};

export const handler = withPrisma(handlerImpl);
