import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];

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
    const qrUrl = `${process.env.GUEST_APP_URL || 'http://localhost:3000'}?table=${qrCode}`;
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
};
