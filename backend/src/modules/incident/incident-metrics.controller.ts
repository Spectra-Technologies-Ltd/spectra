import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentMetricsController {
  constructor(private incidentService: IncidentService) {}

  @Get('incidents')
  @Roles('ADMIN', 'EMPLOYEE')
  getIncidentMetrics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    return this.incidentService.getMetrics({
      organizationId: user.organizationId,
      startDate,
      endDate,
      type,
    });
  }
}
