import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
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
  // MailerService now comes from the global MailModule.
  providers: [ReportsService, ReportScheduler, ReportsProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
