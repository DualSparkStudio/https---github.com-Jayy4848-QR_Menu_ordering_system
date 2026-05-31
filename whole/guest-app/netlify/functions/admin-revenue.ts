import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'GET') {
    return error('Method not allowed', 405);
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];

  try {
    const { startDate, endDate } = event.queryStringParameters || {};
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: 'completed',
        createdAt: { gte: start, lte: end },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount;
    });

    return success({
      totalRevenue,
      totalOrders: orders.length,
      averageOrderValue,
      dailyRevenue,
      startDate: start,
      endDate: end,
    });
  } catch (err: any) {
    console.error('Revenue error:', err);
    return error(err.message || 'Failed to fetch revenue stats', 500);
  }
};
