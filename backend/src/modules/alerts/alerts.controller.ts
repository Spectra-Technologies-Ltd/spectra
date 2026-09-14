import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
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

  /** Recent alerts for the caller's organization, optionally filtered by site. */
  @Get()
  list(
    @CurrentUser() user: any,
    @Query('siteId') siteId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.alerts.list(user.organizationId, { siteId, limit });
  }
}
