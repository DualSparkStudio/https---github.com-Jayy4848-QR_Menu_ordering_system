import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    const { subscription, userType, userId, restaurantId, tableId } = JSON.parse(event.body || '{}');

    if (!subscription || !userType || !userId) {
      return error('Missing required fields', 400);
    }

    if (userType === 'admin' && !restaurantId) {
      return error('restaurantId required for admin subscriptions', 400);
    }

    if (userType === 'guest' && !tableId) {
      return error('tableId required for guest subscriptions', 400);
    }

    // Store subscription in database (upsert by endpoint)
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        userType,
        restaurantId: userType === 'admin' ? restaurantId : null,
        tableId: userType === 'guest' ? tableId : null,
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.keys),
        isActive: true,
      },
      update: {
        userId,
        restaurantId: userType === 'admin' ? restaurantId : null,
        tableId: userType === 'guest' ? tableId : null,
        keys: JSON.stringify(subscription.keys),
        isActive: true,
      },
    });

    return success({ message: 'Subscription saved' });
  } catch (err: any) {
    console.error('Push subscribe error:', err);
    return error(err.message || 'Failed to save subscription', 500);
  }
};
