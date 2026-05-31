import { Handler } from '@netlify/functions';
import { withPrisma } from './lib/withPrisma';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const handlerImpl: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];

  // GET - List tables
  if (event.httpMethod === 'GET') {
    try {
      const tables = await prisma.table.findMany({
        where: { restaurantId, deletedAt: null },
        orderBy: { tableNumber: 'asc' },
      });
      return success(tables);
    } catch (err: any) {
      console.error('List tables error:', err);
      return error(err.message || 'Failed to fetch tables', 500);
    }
  }

  // POST - Create table
  if (event.httpMethod === 'POST') {
    try {
      const { tableNumber, section, capacity } = JSON.parse(event.body || '{}');

      if (!tableNumber) return error('Table number is required', 400);

      const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurant) return error('Restaurant not found', 404);

      const existing = await prisma.table.findFirst({
        where: { restaurantId, tableNumber, deletedAt: null },
      });
      if (existing) return error('Table number already exists', 400);

      const qrCode = uuidv4();
      const qrUrl = `${process.env.GUEST_APP_URL || 'https://cafeqrsystem-guest.netlify.app'}?table=${qrCode}`;
      const qrCodeUrl = await QRCode.toDataURL(qrUrl);

      const table = await prisma.table.create({
        data: {
          restaurantId,
          tableNumber,
          section: section || 'main',
          capacity: capacity || 4,
          qrCode,
          qrCodeUrl,
        },
      });

      return success(table, 201);
    } catch (err: any) {
      console.error('Create table error:', err);
      return error(err.message || 'Failed to create table', 500);
    }
  }

  return error('Method not allowed', 405);
};

export const handler = withPrisma(handlerImpl);
