import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  // ============ STAFF ============

  async createStaff(restaurantId: string, data: any) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const existing = await this.prisma.staff.findFirst({ where: { restaurantId, email: data.email } });
    if (existing) throw new BadRequestException('Staff with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const staff = await this.prisma.staff.create({
      data: { restaurantId, name: data.name, email: data.email, phone: data.phone, role: data.role, passwordHash },
    });
    const { passwordHash: _, ...result } = staff;
    return result;
  }

  async findAllStaff(restaurantId: string) {
    return this.prisma.staff.findMany({
      where: { restaurantId },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
  }

  async updateStaff(id: string, data: any) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Staff not found');
    return this.prisma.staff.update({
      where: { id },
      data: { name: data.name, phone: data.phone, role: data.role, isActive: data.isActive },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    });
  }

  async deleteStaff(id: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Staff not found');
    return this.prisma.staff.update({ where: { id }, data: { isActive: false } });
  }

  // ============ DASHBOARD ============

  async getDashboardStats(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTables, occupiedTables,
      totalOrders, todayOrders, pendingOrders,
      totalRevenue, todayRevenue,
      pendingWaiterCalls,
      avgRating,
    ] = await Promise.all([
      this.prisma.table.count({ where: { restaurantId, deletedAt: null } }),
      this.prisma.table.count({ where: { restaurantId, status: 'occupied' } }),
      this.prisma.order.count({ where: { restaurantId } }),
      this.prisma.order.count({ where: { restaurantId, createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { restaurantId, status: { in: ['pending', 'confirmed', 'preparing'] } } }),
      this.prisma.payment.aggregate({ where: { restaurantId, status: 'completed' }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { restaurantId, status: 'completed', completedAt: { gte: today } }, _sum: { amount: true } }),
      this.prisma.waiterCall.count({ where: { restaurantId, status: 'pending' } }),
      this.prisma.review.aggregate({ where: { restaurantId }, _avg: { foodRating: true, serviceRating: true } }),
    ]);

    return {
      tables: { total: totalTables, occupied: occupiedTables, available: totalTables - occupiedTables },
      orders: { total: totalOrders, today: todayOrders, pending: pendingOrders },
      revenue: { total: totalRevenue._sum.amount || 0, today: todayRevenue._sum.amount || 0 },
      waiterCalls: { pending: pendingWaiterCalls },
      ratings: {
        food: +(avgRating._avg.foodRating || 0).toFixed(1),
        service: +(avgRating._avg.serviceRating || 0).toFixed(1),
      },
    };
  }

  async getRevenueStats(restaurantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { restaurantId, status: 'completed' };
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) where.completedAt.gte = startDate;
      if (endDate) where.completedAt.lte = endDate;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: { amount: true, createdAt: true, paymentMethod: true },
    });

    const byMethod: Record<string, number> = {};
    payments.forEach((p: any) => { byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount; });

    return {
      totalRevenue: payments.reduce((s: number, p: any) => s + p.amount, 0),
      byPaymentMethod: byMethod,
      transactionCount: payments.length,
    };
  }
}
