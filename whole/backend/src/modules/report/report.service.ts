import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: startDate, lte: endDate }, status: { not: 'cancelled' } },
      include: { items: { include: { menuItem: { select: { name: true, categoryId: true } } } } },
    });

    const totalRevenue = orders.reduce((s: number, o: any) => s + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top items
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      o.items.forEach((i: any) => {
        if (!itemCounts[i.menuItemId]) itemCounts[i.menuItemId] = { name: i.menuItem.name, count: 0, revenue: 0 };
        itemCounts[i.menuItemId].count += i.quantity;
        itemCounts[i.menuItemId].revenue += i.price * i.quantity;
      });
    });
    const topItems = Object.entries(itemCounts)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily breakdown
    const dailyMap: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      const day = o.createdAt.toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 };
      dailyMap[day].orders++;
      dailyMap[day].revenue += o.totalAmount;
    });
    const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalOrders, avgOrderValue, topItems, daily };
  }

  async getOrderStatusReport(restaurantId: string, startDate: Date, endDate: Date) {
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.order.count({ where: { restaurantId, status, createdAt: { gte: startDate, lte: endDate } } })
      )
    );
    return statuses.reduce((acc, s, i) => ({ ...acc, [s]: counts[i] }), {} as Record<string, number>);
  }
}
