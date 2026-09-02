import { Module } from '@nestjs/common';
import { NapoleonService } from './napoleon.service';
import { NapoleonController } from './napoleon.controller';

@Module({
  controllers: [NapoleonController],
  providers: [NapoleonService],
  exports: [NapoleonService],
})
export class NapoleonModule {}
