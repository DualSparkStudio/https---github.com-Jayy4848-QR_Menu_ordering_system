import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewService, CreateReviewDto } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurants/:restaurantId/reviews')
export class ReviewController {
  constructor(private service: ReviewService) {}

  @Post('orders/:orderId')
  create(@Param('restaurantId') restaurantId: string, @Param('orderId') orderId: string, @Body() dto: CreateReviewDto) {
    return this.service.create(restaurantId, orderId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.service.findAll(restaurantId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Param('restaurantId') restaurantId: string) {
    return this.service.getStats(restaurantId);
  }
}
