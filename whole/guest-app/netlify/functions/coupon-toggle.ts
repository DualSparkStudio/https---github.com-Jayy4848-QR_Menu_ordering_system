import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const couponId = pathParts[pathParts.indexOf('coupons') + 1];

  try {
    if (event.httpMethod === 'PUT') {
      // PUT /restaurants/:restaurantId/coupons/:id/toggle
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) return error('Coupon not found', 404);

      const updated = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: !coupon.isActive },
      });
      return success(updated);
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE /restaurants/:restaurantId/coupons/:id
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) return error('Coupon not found', 404);

      await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: false },
      });
      return success({ message: 'Coupon deleted' });
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Coupon toggle/delete error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
