import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { PushService } from './push.service';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
  ) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('subscribe')
  async subscribe(
    @CurrentUser() user: any,
    @Body()
    body: { endpoint: string; p256dh: string; auth: string },
  ) {
    if (!body?.endpoint || !body?.p256dh || !body?.auth) {
      return { success: false, message: 'endpoint, p256dh and auth are required' };
    }
    const subscription = await this.prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: { p256dh: body.p256dh, auth: body.auth, userId: user.id, userAgent: body.endpoint.split('/')[2] },
      create: {
        userId: user.id,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        userAgent: body.endpoint.split('/')[2],
      },
    });
    return { success: true, subscription };
  }

  @Delete('subscribe')
  async unsubscribe(
    @CurrentUser() user: any,
    @Body() body: { endpoint?: string },
  ) {
    if (!body?.endpoint) {
      // Remove all of the user's subscriptions
      await this.prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
      return { success: true };
    }
    await this.prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: body.endpoint },
    });
    return { success: true };
  }
}
