import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Observable, interval, map, switchMap, filter } from 'rxjs';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller()
export class OrderController {
  constructor(
    private service: OrderService,
    private prisma: PrismaService,
  ) {}

  // Guest: place order
  @Post('restaurants/:restaurantId/tables/:tableId/orders')
  createOrder(
    @Param('restaurantId') restaurantId: string,
    @Param('tableId') tableId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.service.createOrder(restaurantId, tableId, dto);
  }

  // Guest: get active orders for table
  @Get('tables/:tableId/orders/active')
  getActiveOrders(
    @Param('tableId') tableId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.service.getActiveOrdersForTable(tableId, sessionId);
  }

  // Guest: get all orders for table (including completed)
  @Get('tables/:tableId/orders')
  getAllOrders(
    @Param('tableId') tableId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.service.getAllOrdersForTable(tableId, sessionId);
  }

  // Admin: get all orders
  @Get('restaurants/:restaurantId/orders')
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('restaurantId') restaurantId: string,
    @Query('status') status?: string,
    @Query('tableId') tableId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAll(restaurantId, { status, tableId, date });
  }

  // Guest: get single order by ID (no auth — order ID is unguessable)
  @Get('orders/:id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  // SSE endpoint for real-time order updates
  @Sse('orders/:id/stream')
  streamOrderUpdates(@Param('id') id: string): Observable<MessageEvent> {
    return interval(3000).pipe(
      switchMap(() => this.service.findById(id)),
      map((order) => ({
        data: { order, timestamp: new Date().toISOString() },
      })),
    );
  }

  // Clear cart for a table (called after payment completion)
  @Post('tables/:tableId/clear-cart')
  clearTableCart(@Param('tableId') tableId: string) {
    // This is a signal endpoint - actual cart clearing happens on frontend
    // But we can mark table as available if all orders are completed
    return this.service.checkAndFreeTable(tableId);
  }

  // Mark order as paid
  @Put('orders/:id/mark-paid')
  @UseGuards(JwtAuthGuard)
  markAsPaid(@Param('id') id: string) {
    return this.service.markAsPaid(id);
  }

  // Update individual item status
  @Put('order-items/:itemId/status')
  @UseGuards(JwtAuthGuard)
  updateItemStatus(
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.service.updateItemStatus(itemId, status);
  }

  // Auto-release tables for orders older than 2 hours that are not paid
  @Post('admin/restaurants/:restaurantId/tables/auto-release')
  @UseGuards(JwtAuthGuard)
  autoReleaseTables(@Param('restaurantId') restaurantId: string) {
    return this.service.autoReleaseTables(restaurantId);
  }
}
