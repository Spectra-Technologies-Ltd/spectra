import { Module } from '@nestjs/common';
import { NapoleonService } from './napoleon.service';
import { NapoleonController } from './napoleon.controller';
import { BaselinesModule } from '../baselines/baselines.module';

@Module({
  imports: [BaselinesModule],
  controllers: [NapoleonController],
  providers: [NapoleonService],
  exports: [NapoleonService],
})
export class NapoleonModule {}
