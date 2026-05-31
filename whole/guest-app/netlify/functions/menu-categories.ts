import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

// In-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 300000; // 5 minutes

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];
  const isAdmin = event.path.includes('/admin');

  try {
    if (event.httpMethod === 'GET') {
      // Check cache first (only for non-admin)
      if (!isAdmin) {
        const cacheKey = `menu:${restaurantId}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() < cached.expires) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=300, s-maxage=300',
              'X-Cache': 'HIT',
            },
            body: JSON.stringify(cached.data),
          };
        }
      }

      // Optimized query - only essential fields
      const categories = await prisma.category.findMany({
        where: { 
          restaurantId, 
          deletedAt: null,
          ...(isAdmin ? {} : { isActive: true })
        },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          image: true,
          displayOrder: true,
          isActive: true,
          items: {
            where: { 
              deletedAt: null,
              ...(isAdmin ? {} : { isAvailable: true })
            },
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              basePrice: true,
              isVegetarian: true,
              isVegan: true,
              isGlutenFree: true,
              spiceLevel: true,
              calories: true,
              isAvailable: true,
              isFeatured: true,
              preparationTime: true,
              displayOrder: true,
              variants: isAdmin ? true : {
                select: {
                  id: true,
                  name: true,
                  options: true,
                }
              }
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      // Cache for non-admin
      if (!isAdmin) {
        const cacheKey = `menu:${restaurantId}`;
        cache.set(cacheKey, {
          data: categories,
          expires: Date.now() + CACHE_TTL,
        });
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Cache': 'MISS',
        },
        body: JSON.stringify(categories),
      };
    }

    if (event.httpMethod === 'POST') {
      const user = getAuthUser(event);
      if (!user) return error('Unauthorized', 401);

      const body = JSON.parse(event.body || '{}');
      const { name, description, displayOrder, image } = body;

      if (!name) return error('Name is required', 400);

      const existing = await prisma.category.findFirst({
        where: { restaurantId, name, deletedAt: null },
      });
      if (existing) return error('Category already exists', 400);

      const category = await prisma.category.create({
        data: { name, description, displayOrder, image, restaurantId },
      });

      // Invalidate cache
      cache.delete(`menu:${restaurantId}`);

      return success(category, 201);
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Menu categories error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
