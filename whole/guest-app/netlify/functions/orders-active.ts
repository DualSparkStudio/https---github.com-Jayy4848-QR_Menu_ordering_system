import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';

// In-memory cache
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5000; // 5 seconds for active orders

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'GET') {
    return error('Method not allowed', 405);
  }

  const pathParts = event.path.split('/');
  const tableId = pathParts[pathParts.indexOf('tables') + 1];

  try {
    // Check cache
    const cacheKey = `active:${tableId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=5',
          'X-Cache': 'HIT',
        },
        body: JSON.stringify(cached.data),
      };
    }

    // Ultra-optimized query - minimal fields
    const orders = await prisma.order.findMany({
      where: { 
        tableId, 
        status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] }
      },
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
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            createdAt: true,
            updatedAt: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
                isVegetarian: true,
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            taxPercentage: true,
            serviceChargePercentage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        'Cache-Control': 'public, max-age=5',
        'X-Cache': 'MISS',
      },
      body: JSON.stringify(orders),
    };
  } catch (err: any) {
    console.error('Get active orders error:', err);
    return error(err.message || 'Failed to fetch active orders', 500);
  }
};
