import { Module } from '@nestjs/common';
import { PatrolController } from './patrol.controller';
import { PatrolService } from './patrol.service';

@Module({
  controllers: [PatrolController],
  providers: [PatrolService],
  exports: [PatrolService],
})
export class PatrolModule {}
