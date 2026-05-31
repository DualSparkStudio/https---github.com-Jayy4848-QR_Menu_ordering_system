import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurants/:restaurantId/menu')
export class MenuController {
  constructor(private service: MenuService) {}

  // ---- Categories ----
  @Get('categories')
  findCategories(@Param('restaurantId') restaurantId: string) {
    return this.service.findAllCategories(restaurantId);
  }

  @Get('categories/admin')
  @UseGuards(JwtAuthGuard)
  findCategoriesAdmin(@Param('restaurantId') restaurantId: string) {
    return this.service.findAllCategoriesAdmin(restaurantId);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  createCategory(@Param('restaurantId') restaurantId: string, @Body() dto: CreateCategoryDto) {
    return this.service.createCategory(restaurantId, dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  // ---- Items ----
  @Get('items')
  findItems(@Param('restaurantId') restaurantId: string, @Query('categoryId') categoryId?: string) {
    return this.service.findAllItems(restaurantId, categoryId);
  }

  @Get('items/featured')
  getFeatured(@Param('restaurantId') restaurantId: string) {
    return this.service.getFeaturedItems(restaurantId);
  }

  @Get('items/:id')
  findItem(@Param('id') id: string) {
    return this.service.findItemById(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  createItem(@Param('restaurantId') restaurantId: string, @Body() dto: CreateMenuItemDto) {
    return this.service.createMenuItem(restaurantId, dto);
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard)
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.service.updateMenuItem(id, dto);
  }

  @Put('items/:id/toggle-availability')
  @UseGuards(JwtAuthGuard)
  toggleAvailability(@Param('id') id: string) {
    return this.service.toggleAvailability(id);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  deleteItem(@Param('id') id: string) {
    return this.service.deleteMenuItem(id);
  }
}
