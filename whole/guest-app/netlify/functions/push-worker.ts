// Background worker to listen for database notifications and send push notifications
// This is triggered by Supabase webhooks

import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configure web-push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@cafeqrsystem.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// This function is triggered by Supabase webhooks or scheduled
export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { type, record, old_record } = body;

    console.log('Push worker triggered:', { type, record });

    // Handle new order
    if (type === 'INSERT' && record.table === 'Order') {
      await handleNewOrder(record);
    }

    // Handle order status change
    if (type === 'UPDATE' && record.table === 'Order') {
      await handleOrderStatusChange(record, old_record);
    }

    // Handle new item
    if (type === 'INSERT' && record.table === 'OrderItem') {
      await handleNewItem(record);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processed' }),
    };
  } catch (error: any) {
    console.error('Push worker error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function handleNewOrder(order: any) {
  try {
    // Get restaurant ID from table
    const table = await prisma.table.findUnique({
      where: { id: order.tableId },
      select: { restaurantId: true, tableNumber: true },
    });

    if (!table) return;

    // Get admin subscriptions for this restaurant
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        restaurantId: table.restaurantId,
        userType: 'admin',
        isActive: true,
      },
    });

    if (subscriptions.length === 0) return;

    // Send push notifications
    const orderNum = order.orderNumber?.slice(-6) || 'N/A';
    const payload = JSON.stringify({
      title: '🔔 New Order!',
      body: `Order #${orderNum} - Table ${table.tableNumber}`,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data: { orderId: order.id, type: 'new_order' },
    });

    await sendToSubscriptions(subscriptions, payload);
  } catch (error) {
    console.error('Error handling new order:', error);
  }
}

async function handleOrderStatusChange(newOrder: any, oldOrder: any) {
  try {
    // Only notify guests on status change
    if (newOrder.status === oldOrder.status) return;

    // Get subscriptions for this table
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        tableId: newOrder.tableId,
        userType: 'guest',
        isActive: true,
      },
    });

    if (subscriptions.length === 0) return;

    // Determine message
    const statusMessages: Record<string, string> = {
      confirmed: '✅ Order Confirmed!',
      preparing: '👨‍🍳 Preparing Your Order',
      ready: '🔔 Order Ready!',
      served: '🍽️ Enjoy Your Meal!',
    };

    const title = statusMessages[newOrder.status];
    if (!title) return;

    const orderNum = newOrder.orderNumber?.slice(-6) || 'N/A';
    const payload = JSON.stringify({
      title,
      body: `Order #${orderNum}`,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data: { orderId: newOrder.id, type: 'status_update' },
    });

    await sendToSubscriptions(subscriptions, payload);
  } catch (error) {
    console.error('Error handling order status change:', error);
  }
}

async function handleNewItem(item: any) {
  try {
    // Get order and table info
    const order = await prisma.order.findUnique({
      where: { id: item.orderId },
      include: { table: true },
    });

    if (!order) return;

    // Get admin subscriptions for this restaurant
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        restaurantId: order.table.restaurantId,
        userType: 'admin',
        isActive: true,
      },
    });

    if (subscriptions.length === 0) return;

    // Send push notifications
    const orderNum = order.orderNumber?.slice(-6) || 'N/A';
    const payload = JSON.stringify({
      title: '➕ Item Added to Order',
      body: `Order #${orderNum} - Table ${order.table.tableNumber}`,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data: { orderId: order.id, type: 'new_item' },
    });

    await sendToSubscriptions(subscriptions, payload);
  } catch (error) {
    console.error('Error handling new item:', error);
  }
}

async function sendToSubscriptions(subscriptions: any[], payload: string) {
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

        return { success: false, id: sub.id };
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
  console.log(`Sent ${sent}/${subscriptions.length} push notifications`);
}
