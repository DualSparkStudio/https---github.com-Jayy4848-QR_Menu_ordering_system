import { Handler } from '@netlify/functions';
import webpush from 'web-push';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@cafeqrsystem.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    const { restaurantId, tableId, userType, title, body, data } = JSON.parse(event.body || '{}');

    if (!title) {
      return error('Missing title', 400);
    }

    // Fetch subscriptions based on target
    let subscriptions;
    if (userType === 'admin' && restaurantId) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: { 
          restaurantId,
          userType: 'admin',
          isActive: true,
        },
      });
    } else if (userType === 'guest' && tableId) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: { 
          tableId,
          userType: 'guest',
          isActive: true,
        },
      });
    } else {
      return error('Invalid target', 400);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return success({ message: 'No active subscriptions', sent: 0 });
    }

    // Send push notifications
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data,
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys),
          };
          
          await webpush.sendNotification(pushSubscription, payload);
          return { success: true, id: sub.id };
        } catch (err: any) {
          console.error('Failed to send to subscription:', sub.id, err);
          
          // If subscription is invalid, mark as inactive
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false },
            });
          }
          
          return { success: false, id: sub.id, error: err.message };
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - sent;

    return success({ 
      message: 'Push notifications sent',
      sent,
      failed,
      total: subscriptions.length,
    });
  } catch (err: any) {
    console.error('Push send error:', err);
    return error(err.message || 'Failed to send notifications', 500);
  }
};
