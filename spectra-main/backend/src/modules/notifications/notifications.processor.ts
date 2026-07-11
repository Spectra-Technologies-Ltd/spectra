import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'incident-alert':
        this.logger.log(`Processing incident alert for Incident ID: ${job.data.id}`);
        // Here we would integrate with SMS/Email services to notify supervisors/clients
        await this.simulateNotificationSend();
        this.logger.log(`Incident alert sent successfully.`);
        break;
      
      case 'attendance-report':
        this.logger.log(`Generating attendance report for Site ID: ${job.data.siteId}`);
        // PDF generation or aggregate logic goes here
        break;
        
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async simulateNotificationSend() {
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}
