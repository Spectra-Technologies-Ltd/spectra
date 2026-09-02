import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, status: 'UNREAD' },
    });
    return { count };
  }

  @Get()
  async getRecent(@CurrentUser() user: any) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, message: true, type: true, status: true, createdAt: true },
    });
  }

  @Post(':id/read')
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { status: 'READ' },
    });
    return { success: true };
  }
}
