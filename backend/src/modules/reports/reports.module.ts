import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { MailerService } from './mailer.service';
import { ReportScheduler, ReportsProcessor } from './reports.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reports',
    }),
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, MailerService, ReportScheduler, ReportsProcessor],
  exports: [ReportsService, MailerService],
})
export class ReportsModule {}
