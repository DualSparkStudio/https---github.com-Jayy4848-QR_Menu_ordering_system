import { Handler } from '@netlify/functions';
import { withPrisma } from './lib/withPrisma';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

const handlerImpl: Handler = async (event) => {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      totalTables,
      occupiedTables,
      pendingWaiterCalls,
      avgRatings,
    ] = await Promise.all([
      prisma.order.count({ where: { restaurantId } }),
      prisma.order.count({ where: { restaurantId, createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { restaurantId, status: { in: ['pending', 'confirmed', 'preparing'] } } }),
      prisma.order.aggregate({ where: { restaurantId, status: 'completed' }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { restaurantId, status: 'completed', createdAt: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true } }),
      prisma.table.count({ where: { restaurantId, deletedAt: null } }),
      prisma.table.count({ where: { restaurantId, status: 'occupied', deletedAt: null } }),
      prisma.waiterCall.count({ where: { restaurantId, status: 'pending' } }),
      prisma.review.aggregate({ 
        where: { restaurantId }, 
        _avg: { foodRating: true, serviceRating: true } 
      }),
    ]);

    const foodRating = avgRatings._avg.foodRating || 0;
    const serviceRating = avgRatings._avg.serviceRating || 0;
    const overallRating = (foodRating + serviceRating) / 2;

    return success({
      tables: {
        total: totalTables,
        occupied: occupiedTables,
        available: totalTables - occupiedTables,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders,
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        today: todayRevenue._sum.totalAmount || 0,
      },
      ratings: {
        overall: overallRating,
        food: foodRating,
        service: serviceRating,
      },
      waiterCalls: {
        pending: pendingWaiterCalls,
      },
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    return error(err.message || 'Failed to fetch dashboard stats', 500);
  }
};

export const handler = withPrisma(handlerImpl);
