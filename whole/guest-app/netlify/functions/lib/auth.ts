import { Handler, HandlerEvent } from '@netlify/functions';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  restaurantId: string;
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const getAuthUser = (event: HandlerEvent): JwtPayload | null => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
};

export const requireAuth = (handler: Handler): Handler => {
  return async (event, context) => {
    const user = getAuthUser(event);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }
    const result = await handler(event, context);
    return result || {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  };
};
