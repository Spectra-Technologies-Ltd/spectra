import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  BASELINE_METRICS,
  BaselinesService,
  DEFAULT_ACTUAL_DAYS,
  DEFAULT_BASELINE_DAYS,
  isBaselineMetric,
} from './baselines.service';

@Controller('baselines')
@UseGuards(JwtAuthGuard)
export class BaselinesController {
  constructor(private baselines: BaselinesService) {}

  /**
   * Surprise score for a single observation.
   * e.g. /baselines/surprise?siteId=seed-site-chevron-main-gate&metric=INCIDENT_COUNT&value=5
   *
   * NOTE: declared before ':siteId' so the literal path wins.
   */
  @Get('surprise')
  getSurprise(
    @CurrentUser() user: any,
    @Query('siteId') siteId: string,
    @Query('metric') metric: string,
    @Query('value', ParseFloatPipe) value: number,
    @Query('days', new DefaultValuePipe(DEFAULT_BASELINE_DAYS), ParseIntPipe) days: number,
  ) {
    if (!siteId) throw new BadRequestException('siteId is required');
    if (!metric) throw new BadRequestException('metric is required');
    if (!isBaselineMetric(metric)) {
      throw new BadRequestException(`metric must be one of ${BASELINE_METRICS.join(', ')}`);
    }
    return this.baselines.getSurprise(user.organizationId, siteId, metric, value, days);
  }

  /** Baseline vs actual for a site, with a deviation flag per metric. */
  @Get(':siteId/comparison')
  getComparison(
    @CurrentUser() user: any,
    @Param('siteId') siteId: string,
    @Query('actualDays', new DefaultValuePipe(DEFAULT_ACTUAL_DAYS), ParseIntPipe)
    actualDays: number,
    @Query('baselineDays', new DefaultValuePipe(DEFAULT_BASELINE_DAYS), ParseIntPipe)
    baselineDays: number,
  ) {
    return this.baselines.getComparison(user.organizationId, siteId, actualDays, baselineDays);
  }

  /** What is "normal" for a site: per-metric baseline mean, spread, p95, samples. */
  @Get(':siteId')
  getBaselines(
    @CurrentUser() user: any,
    @Param('siteId') siteId: string,
    @Query('days', new DefaultValuePipe(DEFAULT_BASELINE_DAYS), ParseIntPipe) days: number,
  ) {
    return this.baselines.getBaselineStats(user.organizationId, siteId, days);
  }
}
