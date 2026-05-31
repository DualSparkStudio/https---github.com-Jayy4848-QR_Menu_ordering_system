import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import * as bcrypt from 'bcryptjs';
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
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return error('Email and password are required', 400);
    }

    // Find staff
    const staff = await prisma.staff.findFirst({ where: { email } });
    if (!staff) {
      return error('Invalid credentials', 401);
    }

    // Verify password
    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      return error('Invalid credentials', 401);
    }

    if (!staff.isActive) {
      return error('Account is inactive', 401);
    }

    // Generate tokens
    const payload = {
      sub: staff.id,
      email: staff.email,
      role: staff.role,
      restaurantId: staff.restaurantId,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Update last login
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    return success({
      accessToken,
      refreshToken,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        restaurantId: staff.restaurantId,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return error(err.message || 'Login failed', 500);
  }
};
