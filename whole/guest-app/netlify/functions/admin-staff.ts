import { Handler } from '@netlify/functions';
import { prisma } from './lib/prisma';
import { success, error, handleCors } from './lib/response';
import { getAuthUser } from './lib/auth';
import * as bcrypt from 'bcryptjs';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  const user = getAuthUser(event);
  if (!user) return error('Unauthorized', 401);

  const pathParts = event.path.split('/');
  const restaurantId = pathParts[pathParts.indexOf('restaurants') + 1];
  const staffId = pathParts[pathParts.length - 1];

  try {
    if (event.httpMethod === 'GET') {
      // GET /admin/restaurants/:restaurantId/staff
      const staff = await prisma.staff.findMany({
        where: { restaurantId, isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return success(staff);
    }

    if (event.httpMethod === 'POST') {
      // POST /admin/restaurants/:restaurantId/staff
      const { email, name, phone, password, role } = JSON.parse(event.body || '{}');

      if (!email || !name || !password || !phone) {
        return error('Email, name, phone, and password are required', 400);
      }

      const existing = await prisma.staff.findFirst({
        where: { email, isActive: true },
      });
      if (existing) return error('Email already exists', 400);

      const passwordHash = await bcrypt.hash(password, 10);

      const staff = await prisma.staff.create({
        data: {
          restaurantId,
          email,
          name,
          phone,
          passwordHash,
          role: role || 'staff',
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return success(staff, 201);
    }

    if (event.httpMethod === 'PUT') {
      // PUT /admin/restaurants/:restaurantId/staff/:id
      const body = JSON.parse(event.body || '{}');
      
      const staff = await prisma.staff.findUnique({ where: { id: staffId } });
      if (!staff) return error('Staff not found', 404);

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email;
      if (body.phone) updateData.phone = body.phone;
      if (body.role) updateData.role = body.role;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.password) {
        updateData.passwordHash = await bcrypt.hash(body.password, 10);
      }

      const updated = await prisma.staff.update({
        where: { id: staffId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return success(updated);
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE /admin/restaurants/:restaurantId/staff/:id
      const staff = await prisma.staff.findUnique({ where: { id: staffId } });
      if (!staff) return error('Staff not found', 404);

      await prisma.staff.update({
        where: { id: staffId },
        data: { isActive: false },
      });

      return success({ message: 'Staff deleted' });
    }

    return error('Method not allowed', 405);
  } catch (err: any) {
    console.error('Admin staff error:', err);
    return error(err.message || 'Failed to process request', 500);
  }
};
