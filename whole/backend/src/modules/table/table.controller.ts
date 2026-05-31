import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Public endpoint: look up table by QR code (no restaurantId needed)
@Controller('tables')
export class TablePublicController {
  constructor(private service: TableService) {}

  @Get('qr/:qrCode')
  findByQR(@Param('qrCode') qrCode: string) {
    return this.service.findByQrCode(qrCode);
  }

  @Get('number/:tableNumber')
  findByNumber(@Param('tableNumber') tableNumber: string) {
    return this.service.findByTableNumber(tableNumber);
  }
}

@Controller('restaurants/:restaurantId/tables')
export class TableController {
  constructor(private service: TableService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.service.findAll(restaurantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('restaurantId') restaurantId: string, @Body() dto: CreateTableDto) {
    return this.service.create(restaurantId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }

  @Put(':id/regenerate-qr')
  @UseGuards(JwtAuthGuard)
  regenerateQR(@Param('id') id: string) {
    return this.service.regenerateQR(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
