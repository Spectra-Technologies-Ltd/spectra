import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('ADMIN', 'EMPLOYEE')
  getStats(@CurrentUser() user: any) {
    return this.dashboardService.getStats(user.organizationId);
  }

  @Get('incidents-by-type')
  @Roles('ADMIN', 'EMPLOYEE')
  getIncidentsByType(@CurrentUser() user: any) {
    return this.dashboardService.getIncidentsByType(user.organizationId);
  }

  @Get('site-risk-distribution')
  @Roles('ADMIN', 'EMPLOYEE')
  getSiteRiskDistribution(@CurrentUser() user: any) {
    return this.dashboardService.getSiteRiskDistribution(user.organizationId);
  }

  @Get('attendance-trend')
  @Roles('ADMIN', 'EMPLOYEE')
  getAttendanceTrend(@CurrentUser() user: any) {
    return this.dashboardService.getAttendanceTrend(user.organizationId);
  }

  @Get('recent-activities')
  @Roles('ADMIN', 'EMPLOYEE')
  getRecentActivities(@CurrentUser() user: any) {
    return this.dashboardService.getRecentActivities(user.organizationId);
  }
}
