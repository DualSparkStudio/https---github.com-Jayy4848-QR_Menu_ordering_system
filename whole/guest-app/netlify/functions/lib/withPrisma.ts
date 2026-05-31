import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { prisma } from './prisma';

/**
 * Wrapper for Netlify functions that use Prisma.
 * Automatically disconnects Prisma after the handler completes.
 * This prevents connection pool exhaustion in serverless environments.
 */
export function withPrisma(handler: Handler): Handler {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    try {
      const response = await handler(event, context);
      // Disconnect in background to not block response
      prisma.$disconnect().catch(console.error);
      return response as HandlerResponse;
    } catch (error) {
      // Disconnect in background even on error
      prisma.$disconnect().catch(console.error);
      throw error;
    }
  };
}
