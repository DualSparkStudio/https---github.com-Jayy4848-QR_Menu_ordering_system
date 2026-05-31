import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];

  try {
    if (event.httpMethod === 'GET') {
      // GET /restaurants/:restaurantId/menu/items
      const categoryId = event.queryStringParameters?.categoryId;
      
      const items = await prisma.menuItem.findMany({
        where: {
          restaurantId,
          ...(categoryId ? { categoryId } : {}),
          deletedAt: null,
        },
        include: {
          variants: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { displayOrder: 'asc' },
      });
      return success(items);
    }

    if (event.httpMethod === 'POST') {
      // POST /restaurants/:restaurantId/menu/items
      const user = getAuthUser(event);
      if (!user) return error('Unauthorized', 401);

      const body = JSON.parse(event.body || '{}');
      const { categoryId, name, description, basePrice, image, isVegetarian, isAvailable, isFeatured, displayOrder } = body;

      if (!categoryId || !name || basePrice === undefined) {
        return error('categoryId, name, and basePrice are required', 400);
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || category.restaurantId !== restaurantId) {
        return error('Category not found', 404);
      }

      const item = await prisma.menuItem.create({
        data: {
          categoryId,
          name,
          description,
          basePrice,
          image,
          isVegetarian,
          isAvailable,
          isFeatured,
          displayOrder,
          restaurantId,
        },
      });
      return success(item, 201);
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Menu items error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
