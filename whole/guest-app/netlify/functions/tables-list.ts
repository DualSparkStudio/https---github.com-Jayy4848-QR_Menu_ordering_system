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
    const tables = await prisma.table.findMany({
      where: { restaurantId, deletedAt: null },
      orderBy: [{ section: 'asc' }, { tableNumber: 'asc' }],
    });

    return success(tables);
  } catch (err: any) {
    console.error('List tables error:', err);
    return error(err.message || 'Failed to fetch tables', 500);
  }
};
