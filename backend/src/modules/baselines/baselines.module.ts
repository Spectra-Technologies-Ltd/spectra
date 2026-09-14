import { Module } from '@nestjs/common';
import { BaselinesService } from './baselines.service';
import { BaselinesController } from './baselines.controller';

@Module({
  controllers: [BaselinesController],
  providers: [BaselinesService],
  exports: [BaselinesService],
})
export class BaselinesModule {}
