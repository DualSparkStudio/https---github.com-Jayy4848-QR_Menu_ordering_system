import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { v4 as uuidv4 } from 'uuid';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    const { tableId, guestName, guestPhone, guestCount } = JSON.parse(event.body || '{}');

    if (!tableId) {
      return error('tableId is required', 400);
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return error('Table not found', 404);
    }

    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    await prisma.tableSession.create({
      data: {
        tableId,
        sessionToken,
        guestName,
        guestPhone,
        guestCount: guestCount || 1,
        expiresAt,
      },
    });

    return success({
      sessionToken,
      tableId,
      restaurantId: table.restaurantId,
      expiresAt,
    });
  } catch (err: any) {
    console.error('Create session error:', err);
    return error(err.message || 'Failed to create session', 500);
  }
};
