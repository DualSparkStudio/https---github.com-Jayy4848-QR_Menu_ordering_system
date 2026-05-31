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
  const isStats = event.path.includes('/stats');

  try {
    if (event.httpMethod === 'GET') {
      const user = getAuthUser(event);
      if (!user) return error('Unauthorized', 401);

      if (isStats) {
        // GET /restaurants/:restaurantId/reviews/stats
        const reviews = await prisma.review.findMany({
          where: { restaurantId },
        });

        const totalReviews = reviews.length;
        const averageFoodRating = totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.foodRating, 0) / totalReviews
          : 0;
        const averageServiceRating = totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.serviceRating, 0) / totalReviews
          : 0;
        const averageRating = (averageFoodRating + averageServiceRating) / 2;

        const foodRatingDistribution = {
          5: reviews.filter(r => r.foodRating === 5).length,
          4: reviews.filter(r => r.foodRating === 4).length,
          3: reviews.filter(r => r.foodRating === 3).length,
          2: reviews.filter(r => r.foodRating === 2).length,
          1: reviews.filter(r => r.foodRating === 1).length,
        };

        const serviceRatingDistribution = {
          5: reviews.filter(r => r.serviceRating === 5).length,
          4: reviews.filter(r => r.serviceRating === 4).length,
          3: reviews.filter(r => r.serviceRating === 3).length,
          2: reviews.filter(r => r.serviceRating === 2).length,
          1: reviews.filter(r => r.serviceRating === 1).length,
        };

        return success({ 
          totalReviews, 
          averageRating,
          averageFoodRating,
          averageServiceRating,
          foodRatingDistribution,
          serviceRatingDistribution
        });
      } else {
        // GET /restaurants/:restaurantId/reviews
        const reviews = await prisma.review.findMany({
          where: { restaurantId },
          include: {
            order: {
              select: {
                orderNumber: true,
                table: { select: { tableNumber: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return success(reviews);
      }
    }

    if (event.httpMethod === 'POST') {
      // POST /restaurants/:restaurantId/reviews/orders/:orderId
      const orderId = pathParts[pathParts.indexOf('orders') + 1];
      const { foodRating, serviceRating, comment, guestName } = JSON.parse(event.body || '{}');

      if (!foodRating || !serviceRating) return error('Food rating and service rating are required', 400);

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return error('Order not found', 404);
      if (order.restaurantId !== restaurantId) return error('Order does not belong to this restaurant', 400);

      const existingReview = await prisma.review.findUnique({
        where: { orderId },
      });
      if (existingReview) return error('Review already exists for this order', 400);

      const review = await prisma.review.create({
        data: {
          restaurantId,
          orderId,
          foodRating,
          serviceRating,
          comment,
          guestName,
        },
      });

      return success(review, 201);
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Reviews error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
