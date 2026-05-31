import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateWaiterCallDto, UpdateWaiterCallDto } from './dto/waiter-call.dto';

@Injectable()
export class WaiterCallService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async create(restaurantId: string, tableId: string, dto: CreateWaiterCallDto) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundException('Table not found');

    const call = await this.prisma.waiterCall.create({
      data: { restaurantId, tableId, type: dto.type, note: dto.note },
      include: { table: { select: { tableNumber: true, section: true } } },
    });

    await this.redis.publish(`restaurant:${restaurantId}`, JSON.stringify({ event: 'waiter_called', data: call }));
    return call;
  }

  async findAll(restaurantId: string, status?: string) {
    return this.prisma.waiterCall.findMany({
      where: { restaurantId, ...(status ? { status } : {}) },
      include: { table: { select: { tableNumber: true, section: true } }, assignedStaff: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateWaiterCallDto) {
    const call = await this.prisma.waiterCall.findUnique({ where: { id } });
    if (!call) throw new NotFoundException('Waiter call not found');

    const updates: any = { status: dto.status };
    if (dto.assignedStaffId) updates.assignedStaffId = dto.assignedStaffId;
    if (dto.status === 'resolved') updates.resolvedAt = new Date();

    const updated = await this.prisma.waiterCall.update({ where: { id }, data: updates });
    await this.redis.publish(`restaurant:${call.restaurantId}`, JSON.stringify({ event: 'waiter_call_updated', data: updated }));
    return updated;
  }
}
