import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.length - 1];
  const isSlug = pathParts.includes('slug');

  try {
    if (event.httpMethod === 'GET') {
      if (isSlug) {
        // GET /restaurants/slug/:slug
        const slug = restaurantId;
        const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
        if (!restaurant) return error('Restaurant not found', 404);
        return success(restaurant);
      } else if (restaurantId && restaurantId !== 'restaurants') {
        // GET /restaurants/:id
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) return error('Restaurant not found', 404);
        return success(restaurant);
      } else {
        // GET /restaurants
        const restaurants = await prisma.restaurant.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });
        return success(restaurants);
      }
    }

    const user = getAuthUser(event);
    if (!user) return error('Unauthorized', 401);

    if (event.httpMethod === 'POST') {
      // POST /restaurants
      const body = JSON.parse(event.body || '{}');
      const restaurant = await prisma.restaurant.create({ data: body });
      return success(restaurant, 201);
    }

    if (event.httpMethod === 'PUT') {
      // PUT /restaurants/:id
      const body = JSON.parse(event.body || '{}');
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurant) return error('Restaurant not found', 404);

      const updated = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: body,
      });
      return success(updated);
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE /restaurants/:id
      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurant) return error('Restaurant not found', 404);

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { deletedAt: new Date() },
      });
      return success({ message: 'Restaurant deleted' });
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Restaurants error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
