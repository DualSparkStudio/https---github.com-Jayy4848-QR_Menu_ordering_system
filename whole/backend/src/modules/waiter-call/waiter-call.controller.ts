import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WaiterCallService } from './waiter-call.service';
import { CreateWaiterCallDto, UpdateWaiterCallDto } from './dto/waiter-call.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class WaiterCallController {
  constructor(private service: WaiterCallService) {}

  @Post('restaurants/:restaurantId/tables/:tableId/waiter-calls')
  create(
    @Param('restaurantId') restaurantId: string,
    @Param('tableId') tableId: string,
    @Body() dto: CreateWaiterCallDto,
  ) {
    return this.service.create(restaurantId, tableId, dto);
  }

  @Get('restaurants/:restaurantId/waiter-calls')
  @UseGuards(JwtAuthGuard)
  findAll(@Param('restaurantId') restaurantId: string, @Query('status') status?: string) {
    return this.service.findAll(restaurantId, status);
  }

  @Put('waiter-calls/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateWaiterCallDto) {
    return this.service.update(id, dto);
  }
}
