import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NapoleonService } from './napoleon.service';
import {
  BASELINE_METRICS,
  DEFAULT_BASELINE_DAYS,
  isBaselineMetric,
} from '../baselines/baselines.service';

@Controller('napoleon')
@UseGuards(JwtAuthGuard)
export class NapoleonController {
  constructor(private napoleon: NapoleonService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any) {
    return this.napoleon.getOverview(user.organizationId);
  }

  @Get('risk-by-site')
  getRiskBySite(@CurrentUser() user: any) {
    return this.napoleon.getRiskBySite(user.organizationId);
  }

  @Get('at-risk-guards')
  getAtRiskGuards(@CurrentUser() user: any) {
    return this.napoleon.getAtRiskGuards(user.organizationId);
  }

  /**
   * Score one observation against a site's baseline for a tracked metric.
   * e.g. /napoleon/surprise?siteId=seed-site-chevron-main-gate&metric=PATROL_DURATION_MS&value=420000
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
      throw new BadRequestException(
        `metric must be one of ${BASELINE_METRICS.join(', ')}`,
      );
    }
    return this.napoleon.getSurprise(user.organizationId, siteId, metric, value, days);
  }
}
