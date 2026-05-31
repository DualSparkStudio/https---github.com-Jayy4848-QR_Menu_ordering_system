import { Handler } from '@netlify/functions';
import { success, error, handleCors } from './lib/response';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  if (event.httpMethod !== 'POST') {
    return error('Method not allowed', 405);
  }

  try {
    const { refreshToken } = JSON.parse(event.body || '{}');

    if (!refreshToken) {
      return error('refreshToken is required', 400);
    }

    const payload: any = jwt.verify(refreshToken, JWT_SECRET);
    const accessToken = jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        restaurantId: payload.restaurantId,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return success({ accessToken });
  } catch (err: any) {
    console.error('Refresh token error:', err);
    return error('Invalid refresh token', 401);
  }
};
