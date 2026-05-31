import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateTableDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const existing = await this.prisma.table.findFirst({
      where: { restaurantId, tableNumber: dto.tableNumber, deletedAt: null },
    });
    if (existing) throw new BadRequestException('Table number already exists');

    const qrCode = uuidv4();
    const qrUrl = `${process.env.GUEST_APP_URL || 'http://localhost:3000'}?table=${qrCode}`;
    const qrCodeUrl = await QRCode.toDataURL(qrUrl);

    return this.prisma.table.create({
      data: { restaurantId, tableNumber: dto.tableNumber, section: dto.section || 'main', capacity: dto.capacity || 4, qrCode, qrCodeUrl },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId, deletedAt: null },
      orderBy: [{ section: 'asc' }, { tableNumber: 'asc' }],
    });
  }

  async findById(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async findByQrCode(qrCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode },
      include: { restaurant: { select: { id: true, name: true, slug: true, logo: true, currency: true, taxPercentage: true, serviceChargePercentage: true, cgstPercentage: true, sgstPercentage: true, isOpen: true } } },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async findByTableNumber(tableNumber: string) {
    // Find the first active restaurant's table with this number
    const table = await this.prisma.table.findFirst({
      where: { tableNumber, deletedAt: null, isActive: true },
      include: { restaurant: { select: { id: true, name: true, slug: true, logo: true, currency: true, taxPercentage: true, serviceChargePercentage: true, cgstPercentage: true, sgstPercentage: true, isOpen: true } } },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(id: string, dto: UpdateTableDto) {
    await this.findById(id);
    return this.prisma.table.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.table.update({ where: { id }, data: { status } });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.table.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async regenerateQR(id: string) {
    const table = await this.findById(id);
    const qrCode = uuidv4();
    const qrUrl = `${process.env.GUEST_APP_URL || 'http://localhost:3000'}?table=${qrCode}`;
    const qrCodeUrl = await QRCode.toDataURL(qrUrl);
    return this.prisma.table.update({ where: { id }, data: { qrCode, qrCodeUrl } });
  }
}
