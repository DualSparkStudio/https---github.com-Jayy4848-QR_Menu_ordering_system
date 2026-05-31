import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurants/:restaurantId/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.prisma.notification.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
