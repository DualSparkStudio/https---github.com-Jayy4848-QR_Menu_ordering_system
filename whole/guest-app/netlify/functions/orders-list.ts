import { Handler } from '@netlify/functions';
import { withPrisma } from './lib/withPrisma';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

// In-memory cache
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 3000; // 3 seconds for admin orders

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
    const { status, tableId, date } = event.queryStringParameters || {};

    // Create cache key
    const cacheKey = `orders:${restaurantId}:${status || 'all'}:${tableId || 'all'}:${date || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'private, max-age=3',
          'X-Cache': 'HIT',
        },
        body: JSON.stringify(cached.data),
      };
    }

    const where: any = { restaurantId };
    if (status) where.status = status;
    if (tableId) where.tableId = tableId;
    if (date) {
      const d = new Date(date);
      where.createdAt = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }

    // Optimized query - only fetch what's needed
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        taxAmount: true,
        serviceCharge: true,
        discountAmount: true,
        totalAmount: true,
        couponCode: true,
        guestName: true,
        specialInstructions: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            tableNumber: true,
            section: true,
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            paymentMethod: true,
          }
        },
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
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 most recent orders
    });

    // Cache result
    cache.set(cacheKey, {
      data: orders,
      expires: Date.now() + CACHE_TTL,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'private, max-age=3',
        'X-Cache': 'MISS',
      },
      body: JSON.stringify(orders),
    };
  } catch (err: any) {
    console.error('List orders error:', err);
    return error(err.message || 'Failed to fetch orders', 500);
  }
};

export const handler = withPrisma(handlerImpl);
