import { Handler } from '@netlify/functions';
import { withPrisma } from './lib/withPrisma';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

const handlerImpl: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'PUT') {
    return error('Method not allowed', 405);
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const orderItemId = pathParts[pathParts.indexOf('order-items') + 1];

  try {
    const { status } = JSON.parse(event.body || '{}');

    if (!status) return error('Status is required', 400);

    const orderItem = await prisma.orderItem.findUnique({ 
      where: { id: orderItemId },
      include: { order: true }
    });
    
    if (!orderItem) return error('Order item not found', 404);

    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status },
    });

    return success(updated);
  } catch (err: any) {
    console.error('Update order item status error:', err);
    return error(err.message || 'Failed to update order item status', 500);
  }
};

export const handler = withPrisma(handlerImpl);
