import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'PUT') {
    return error('Method not allowed', 405);
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const orderId = pathParts[pathParts.indexOf('orders') + 1];

  try {
    const { status } = JSON.parse(event.body || '{}');

    if (!status) return error('Status is required', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return error('Order not found', 404);

    const updates: any = { status };
    if (status === 'served') updates.servedAt = new Date();
    if (status === 'completed') updates.completedAt = new Date();
    if (status === 'cancelled') {
      updates.cancelledAt = new Date();
      const activeOrders = await prisma.order.count({
        where: { tableId: order.tableId, status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] } },
      });
      if (activeOrders <= 1) {
        await prisma.table.update({ where: { id: order.tableId }, data: { status: 'available' } });
      }
    }

    const updated = await prisma.order.update({ where: { id: orderId }, data: updates });

    // Check if order is completed and paid, then free the table
    if (status === 'completed' && updated.paymentStatus === 'completed') {
      const activeOrders = await prisma.order.count({
        where: { tableId: order.tableId, status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'served'] } },
      });
      if (activeOrders === 0) {
        await prisma.table.update({ where: { id: order.tableId }, data: { status: 'available' } });
      }
    }

    return success(updated);
  } catch (err: any) {
    console.error('Update order status error:', err);
    return error(err.message || 'Failed to update order status', 500);
  }
};
