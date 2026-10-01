import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { BadgeController } from './badge.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController, BadgeController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
