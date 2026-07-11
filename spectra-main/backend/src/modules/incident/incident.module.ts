import { Module } from '@nestjs/common';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

@Module({
  controllers: [IncidentController],
  providers: [IncidentService],
  exports: [IncidentService],
})
export class IncidentModule {}
