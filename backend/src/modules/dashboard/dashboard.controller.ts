import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('incidents-by-type')
  @Roles('CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR')
  getIncidentsByType() {
    return this.dashboardService.getIncidentsByType();
  }

  @Get('site-risk-distribution')
  @Roles('CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR')
  getSiteRiskDistribution() {
    return this.dashboardService.getSiteRiskDistribution();
  }

  @Get('attendance-trend')
  @Roles('CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR')
  getAttendanceTrend() {
    return this.dashboardService.getAttendanceTrend();
  }

  @Get('recent-activities')
  @Roles('CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR')
  getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }
}
