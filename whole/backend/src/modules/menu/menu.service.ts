import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ============ CATEGORIES ============

  async createCategory(restaurantId: string, dto: CreateCategoryDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const existing = await this.prisma.category.findFirst({
      where: { restaurantId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new BadRequestException('Category already exists');

    return this.prisma.category.create({ data: { ...dto, restaurantId } });
  }

  async findAllCategories(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null, isAvailable: true },
          include: { variants: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAllCategoriesAdmin(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          include: { variants: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ============ MENU ITEMS ============

  async createMenuItem(restaurantId: string, dto: CreateMenuItemDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category || category.restaurantId !== restaurantId) throw new NotFoundException('Category not found');

    return this.prisma.menuItem.create({ data: { ...dto, restaurantId } });
  }

  async findAllItems(restaurantId: string, categoryId?: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, ...(categoryId ? { categoryId } : {}), deletedAt: null },
      include: { variants: true, category: { select: { id: true, name: true } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findItemById(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { variants: true, category: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    await this.findItemById(id);
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async toggleAvailability(id: string) {
    const item = await this.findItemById(id);
    return this.prisma.menuItem.update({ where: { id }, data: { isAvailable: !item.isAvailable } });
  }

  async deleteMenuItem(id: string) {
    await this.findItemById(id);
    return this.prisma.menuItem.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getFeaturedItems(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, isFeatured: true, isAvailable: true, deletedAt: null },
      include: { variants: true, category: { select: { id: true, name: true } } },
    });
  }
}
