import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  BaselinesService,
  DEFAULT_ACTUAL_DAYS,
  DEFAULT_BASELINE_DAYS,
} from './baselines.service';

@Controller('baselines')
@UseGuards(JwtAuthGuard)
export class BaselinesController {
  constructor(private baselines: BaselinesService) {}

  /** Baseline vs actual for a site, with a deviation flag per metric. */
  @Get(':siteId')
  getSiteBaselines(
    @CurrentUser() user: any,
    @Param('siteId') siteId: string,
    @Query('actualDays', new DefaultValuePipe(DEFAULT_ACTUAL_DAYS), ParseIntPipe)
    actualDays: number,
    @Query('baselineDays', new DefaultValuePipe(DEFAULT_BASELINE_DAYS), ParseIntPipe)
    baselineDays: number,
  ) {
    return this.baselines.getSiteBaselines(
      user.organizationId,
      siteId,
      actualDays,
      baselineDays,
    );
  }
}
