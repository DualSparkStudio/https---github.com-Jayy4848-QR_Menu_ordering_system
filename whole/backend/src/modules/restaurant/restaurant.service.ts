import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRestaurantDto) {
    const existing = await this.prisma.restaurant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('Slug already taken');
    return this.prisma.restaurant.create({ data: dto });
  }

  async findAll() {
    return this.prisma.restaurant.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, city: true, logo: true, isOpen: true, currency: true },
    });
  }

  async findBySlug(slug: string) {
    const r = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: { where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: 'asc' } },
      },
    });
    if (!r) throw new NotFoundException('Restaurant not found');
    return r;
  }

  async findById(id: string) {
    const r = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Restaurant not found');
    return r;
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    await this.findById(id);
    return this.prisma.restaurant.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.restaurant.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
