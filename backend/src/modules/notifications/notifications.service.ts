import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    private prisma: PrismaService,
    private realtime: RealtimeService,
    private push: PushService,
  ) {}

  /**
   * Create an in-app notification for a user, fan it out over the realtime
   * stream, and attempt a web-push delivery to their devices.
   */
  async create(
    userId: string,
    organizationId: string,
    title: string,
    message: string,
    type = 'IN_APP',
    url?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, message, type, status: 'UNREAD' },
    });

    this.realtime.publish(organizationId, 'notification:created', {
      id: notification.id,
      title,
      message,
      type,
      status: 'UNREAD',
      createdAt: notification.createdAt.toISOString(),
      userId,
    });

    // Fire web push (best effort, never blocks)
    if (type !== 'IN_APP') {
      this.sendPush(userId, organizationId, title, message, url).catch(() => {});
    }

    return notification;
  }

  async sendPush(userId: string, organizationId: string, title: string, message: string, url?: string) {
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, p256dh: true, auth: true, id: true },
    });
    if (subs.length === 0) return;

    for (const sub of subs) {
      const status = await this.push.send(sub, title, message, url);
      if (status === 404 || status === 410) {
        await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
    this.logger.debug(`Push sent to ${subs.length} device(s)`);
  }

  async sendIncidentAlert(incidentData: any) {
    // Queue for heavyweight work (email/SMS integration later)
    await this.notificationsQueue.add('incident-alert', incidentData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });

    // Immediate in-app + push to command staff
    try {
      const staff = await this.prisma.user.findMany({
        where: {
          organizationId: incidentData.organizationId ?? incidentData.site?.organizationId,
          role: { in: ['CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR'] },
          isActive: true,
        },
        select: { id: true, organizationId: true },
      });

      for (const user of staff) {
        await this.create(
          user.id,
          user.organizationId,
          `Incident: ${incidentData.title ?? incidentData.type ?? 'New incident'}`,
          `${incidentData.severity ?? ''} ${incidentData.type ?? 'ALERT'} at ${incidentData.siteName ?? 'site'}${incidentData.description ? ` — ${String(incidentData.description).slice(0, 120)}` : ''}`,
          'ALERT',
          incidentData.incidentId ? `/incidents/${incidentData.incidentId}` : '/incidents',
        ).catch((err) => this.logger.warn(`Incident notification failed: ${err.message}`));
      }
    } catch (err) {
      this.logger.warn(`Incident alert fan-out failed: ${(err as Error).message}`);
    }
  }

  async sendAttendanceReport(siteId: string) {
    await this.notificationsQueue.add('attendance-report', { siteId }, {
      attempts: 2,
    });
  }
}
