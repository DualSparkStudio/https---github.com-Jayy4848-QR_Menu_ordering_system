import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto, UpdateRestaurantDto } from './dto/restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurants')
export class RestaurantController {
  constructor(private service: RestaurantService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug); }

  @Get(':id')
  findById(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateRestaurantDto) { return this.service.create(dto); }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) { return this.service.delete(id); }
}
