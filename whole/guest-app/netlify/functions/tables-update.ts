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
  const tableId = pathParts[pathParts.indexOf('tables') + 1];
  const isStatus = event.path.includes('/status');
  const isRegenerateQR = event.path.includes('/regenerate-qr');

  try {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return error('Table not found', 404);

    if (event.httpMethod === 'PUT') {
      if (isStatus) {
        // PUT /restaurants/:restaurantId/tables/:id/status
        const { status } = JSON.parse(event.body || '{}');
        if (!status) return error('Status is required', 400);

        const updated = await prisma.table.update({
          where: { id: tableId },
          data: { status },
        });
        return success(updated);
      } else if (isRegenerateQR) {
        // PUT /restaurants/:restaurantId/tables/:id/regenerate-qr
        const qrCode = uuidv4();
        const qrUrl = `${process.env.GUEST_APP_URL || 'http://localhost:3000'}?table=${qrCode}`;
        const qrCodeUrl = await QRCode.toDataURL(qrUrl);

        const updated = await prisma.table.update({
          where: { id: tableId },
          data: { qrCode, qrCodeUrl },
        });
        return success(updated);
      } else {
        // PUT /restaurants/:restaurantId/tables/:id
        const body = JSON.parse(event.body || '{}');
        const updated = await prisma.table.update({
          where: { id: tableId },
          data: body,
        });
        return success(updated);
      }
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE /restaurants/:restaurantId/tables/:id
      await prisma.table.update({
        where: { id: tableId },
        data: { deletedAt: new Date() },
      });
      return success({ message: 'Table deleted' });
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Update table error:', err);
    return error(err.message || 'Failed to update table', 500);
  }
};

export const handler = withPrisma(handlerImpl);
