import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurants/:restaurantId/reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private service: ReportService) {}

  @Get('sales')
  getSales(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.getSalesReport(restaurantId, new Date(startDate), new Date(endDate));
  }

  @Get('order-status')
  getOrderStatus(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.getOrderStatusReport(restaurantId, new Date(startDate), new Date(endDate));
  }
}
