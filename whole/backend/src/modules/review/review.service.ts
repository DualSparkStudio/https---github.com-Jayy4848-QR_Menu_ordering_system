import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsNumber() @Min(1) @Max(5) foodRating: number;
  @IsNumber() @Min(1) @Max(5) serviceRating: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() guestName?: string;
}

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, orderId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) throw new BadRequestException('Order does not belong to this restaurant');

    const existing = await this.prisma.review.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Review already submitted for this order');

    return this.prisma.review.create({ data: { restaurantId, orderId, ...dto } });
  }

  async findAll(restaurantId: string) {
    return this.prisma.review.findMany({
      where: { restaurantId },
      include: { order: { select: { orderNumber: true, createdAt: true, table: { select: { tableNumber: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(restaurantId: string) {
    const reviews = await this.prisma.review.findMany({ where: { restaurantId } });
    if (!reviews.length) return { avgFood: 0, avgService: 0, total: 0 };
    const avgFood = reviews.reduce((s: number, r: any) => s + r.foodRating, 0) / reviews.length;
    const avgService = reviews.reduce((s: number, r: any) => s + r.serviceRating, 0) / reviews.length;
    return { avgFood: +avgFood.toFixed(1), avgService: +avgService.toFixed(1), total: reviews.length };
  }
}
