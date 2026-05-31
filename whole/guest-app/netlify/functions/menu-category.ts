import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const categoryId = pathParts[pathParts.length - 1];

  try {
    if (event.httpMethod === 'PUT') {
      // PUT /restaurants/:restaurantId/menu/categories/:id
      const body = JSON.parse(event.body || '{}');
      
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) return error('Category not found', 404);

      const updated = await prisma.category.update({
        where: { id: categoryId },
        data: body,
      });
      return success(updated);
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE /restaurants/:restaurantId/menu/categories/:id
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) return error('Category not found', 404);

      await prisma.category.update({
        where: { id: categoryId },
        data: { deletedAt: new Date() },
      });
      return success({ message: 'Category deleted' });
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Menu category error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
