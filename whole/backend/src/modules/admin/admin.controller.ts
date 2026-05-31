import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/restaurants/:restaurantId')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('dashboard')
  getDashboard(@Param('restaurantId') restaurantId: string) {
    return this.service.getDashboardStats(restaurantId);
  }

  @Get('revenue')
  getRevenue(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getRevenueStats(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('staff')
  findAllStaff(@Param('restaurantId') restaurantId: string) {
    return this.service.findAllStaff(restaurantId);
  }

  @Post('staff')
  createStaff(@Param('restaurantId') restaurantId: string, @Body() body: any) {
    return this.service.createStaff(restaurantId, body);
  }

  @Put('staff/:id')
  updateStaff(@Param('id') id: string, @Body() body: any) {
    return this.service.updateStaff(id, body);
  }

  @Delete('staff/:id')
  deleteStaff(@Param('id') id: string) {
    return this.service.deleteStaff(id);
  }
}
