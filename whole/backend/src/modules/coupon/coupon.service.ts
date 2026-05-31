import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';

export class CreateCouponDto {
  @IsString() code: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['percentage', 'fixed']) discountType: string;
  @IsNumber() @Min(0) discountValue: number;
  @IsOptional() @IsNumber() @Min(0) minOrderValue?: number;
  @IsOptional() @IsNumber() maxDiscount?: number;
  @IsOptional() @IsNumber() usageLimit?: number;
  @IsOptional() expiresAt?: Date;
}

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findFirst({ where: { restaurantId, code: dto.code } });
    if (existing) throw new BadRequestException('Coupon code already exists');
    return this.prisma.coupon.create({ data: { ...dto, restaurantId } });
  }

  async findAll(restaurantId: string) {
    return this.prisma.coupon.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' } });
  }

  async validate(restaurantId: string, code: string, orderTotal: number) {
    if (orderTotal == null || Number.isNaN(Number(orderTotal))) {
      throw new BadRequestException('orderAmount is required');
    }
    const amount = Number(orderTotal);
    const coupon = await this.prisma.coupon.findFirst({ where: { restaurantId, code, isActive: true } });
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new BadRequestException('Coupon usage limit reached');
    if (amount < coupon.minOrderValue) throw new BadRequestException(`Minimum order value is ${coupon.minOrderValue}`);

    const discountAmount = coupon.discountType === 'percentage'
      ? Math.min(amount * coupon.discountValue / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;

    const discount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      discount,
      discountAmount: discount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
      },
    };
  }

  async toggle(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  }

  async delete(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.prisma.coupon.delete({ where: { id } });
  }
}
