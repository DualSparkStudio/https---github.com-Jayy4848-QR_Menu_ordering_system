import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];
  const isValidate = event.path.includes('/validate');

  try {
    if (event.httpMethod === 'GET') {
      // GET /restaurants/:restaurantId/coupons
      const user = getAuthUser(event);
      if (!user) return error('Unauthorized', 401);

      const coupons = await prisma.coupon.findMany({
        where: { restaurantId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      return success(coupons);
    }

    if (event.httpMethod === 'POST') {
      if (isValidate) {
        // POST /restaurants/:restaurantId/coupons/validate
        const { code, orderAmount, tableId } = JSON.parse(event.body || '{}');
        if (!code || orderAmount === undefined) {
          return error('Code and orderAmount are required', 400);
        }

        const coupon = await prisma.coupon.findFirst({
          where: { restaurantId, code, isActive: true },
        });

        if (!coupon) return error('Invalid coupon code', 404);
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          return error('Coupon has expired', 400);
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return error('Coupon usage limit reached', 400);
        }
        
        // Check if this table has already used this coupon
        if (tableId) {
          const existingUsage = await prisma.order.findFirst({
            where: {
              tableId,
              couponCode: code,
              status: { not: 'cancelled' },
            },
          });
          if (existingUsage) {
            return error('You have already used this coupon', 400);
          }
        }
        
        if (orderAmount < coupon.minOrderValue) {
          return error(`Minimum order value is ${coupon.minOrderValue}`, 400);
        }

        const discountAmount = coupon.discountType === 'percentage'
          ? Math.min((orderAmount * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
          : coupon.discountValue;

        return success({ valid: true, coupon, discountAmount });
      } else {
        // POST /restaurants/:restaurantId/coupons
        const user = getAuthUser(event);
        if (!user) return error('Unauthorized', 401);

        const body = JSON.parse(event.body || '{}');
        const coupon = await prisma.coupon.create({
          data: { ...body, restaurantId },
        });
        return success(coupon, 201);
      }
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Coupons error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
