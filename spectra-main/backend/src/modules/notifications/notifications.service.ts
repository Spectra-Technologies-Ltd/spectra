import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private notificationsQueue: Queue) {}

  async sendIncidentAlert(incidentData: any) {
    await this.notificationsQueue.add('incident-alert', incidentData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  }

  async sendAttendanceReport(siteId: string) {
    await this.notificationsQueue.add('attendance-report', { siteId }, {
      attempts: 2,
    });
  }
}
