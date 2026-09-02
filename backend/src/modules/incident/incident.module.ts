import { Module } from '@nestjs/common';
import { IncidentController } from './incident.controller';
import { IncidentMetricsController } from './incident-metrics.controller';
import { IncidentService } from './incident.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [IncidentController, IncidentMetricsController],
  providers: [IncidentService],
  exports: [IncidentService],
})
export class IncidentModule {}
