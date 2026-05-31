import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'GET') {
    return error('Method not allowed', 405);
  }

  const pathParts = event.path.split('/');
  const tableNumber = pathParts[pathParts.length - 1];

  try {
    const table = await prisma.table.findFirst({
      where: { 
        tableNumber,
        deletedAt: null 
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currency: true,
            taxPercentage: true,
            serviceChargePercentage: true,
            isOpen: true,
          },
        },
      },
    });

    if (!table) return error('Table not found', 404);

    return success(table);
  } catch (err: any) {
    console.error('Get table by number error:', err);
    return error(err.message || 'Failed to fetch table', 500);
  }
};
