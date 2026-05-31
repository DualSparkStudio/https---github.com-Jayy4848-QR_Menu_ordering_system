import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CouponService, CreateCouponDto } from './coupon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurants/:restaurantId/coupons')
export class CouponController {
  constructor(private service: CouponService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.service.findAll(restaurantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('restaurantId') restaurantId: string, @Body() dto: CreateCouponDto) {
    return this.service.create(restaurantId, dto);
  }

  @Post('validate')
  validate(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { code: string; orderTotal?: number; orderAmount?: number },
  ) {
    const orderTotal = body.orderTotal ?? body.orderAmount ?? 0;
    return this.service.validate(restaurantId, body.code, orderTotal);
  }

  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard)
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
