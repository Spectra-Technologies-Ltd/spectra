import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  /**
   * Ranked feed of unread alerts (critical first, then anomalies by surprise,
   * then surges). Declared before ':id' so the literal path wins.
   */
  @Get('unread')
  unread(
    @CurrentUser() user: any,
    @Query('siteId') siteId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.alerts.unread(user.organizationId, { siteId, limit });
  }

  /** Recent alerts for the caller's organization, optionally filtered by site. */
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('siteId') siteId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.alerts.list(user.organizationId, { siteId, limit });
  }

  /** Mark one alert as read so it drops out of the unread feed. */
  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.alerts.markRead(user.organizationId, id);
  }
}
