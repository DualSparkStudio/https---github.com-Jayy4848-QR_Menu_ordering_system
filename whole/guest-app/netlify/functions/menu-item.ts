import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const pathParts = event.path.split('/');
  const itemId = pathParts[pathParts.length - 1];
  const isToggle = event.path.includes('toggle-availability');

  try {
    if (event.httpMethod === 'GET') {
      // GET /restaurants/:restaurantId/menu/items/:id
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { variants: true, category: true },
      });
      if (!item) return error('Menu item not found', 404);
      return success(item);
    }

    const user = getAuthUser(event);
    if (!user) return error('Unauthorized', 401);

    if (event.httpMethod === 'PUT') {
      if (isToggle) {
        // PUT /restaurants/:restaurantId/menu/items/:id/toggle-availability
        const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
        if (!item) return error('Menu item not found', 404);

        const updated = await prisma.menuItem.update({
          where: { id: itemId },
          data: { isAvailable: !item.isAvailable },
        });
        return success(updated);
      } else {
        // PUT /restaurants/:restaurantId/menu/items/:id
        const body = JSON.parse(event.body || '{}');
        
        const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
        if (!item) return error('Menu item not found', 404);

        const updated = await prisma.menuItem.update({
          where: { id: itemId },
          data: body,
        });
        return success(updated);
      }
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE /restaurants/:restaurantId/menu/items/:id
      const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
      if (!item) return error('Menu item not found', 404);

      await prisma.menuItem.update({
        where: { id: itemId },
        data: { deletedAt: new Date() },
      });
      return success({ message: 'Menu item deleted' });
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Menu item error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
