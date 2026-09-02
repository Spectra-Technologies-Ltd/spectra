import { Controller, Get, Post, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('site/:siteId/daily/pdf')
  @Roles('ADMIN')
  async getDailySiteReportPdf(
    @Param('siteId') siteId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateDailySiteReport(siteId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Spectra_Report_${siteId}_${new Date().toISOString().split('T')[0]}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('site/:siteId/weekly/pdf')
  @Roles('ADMIN')
  async getWeeklySiteReport(@Param('siteId') siteId: string, @Res() res: Response) {
    const pdf = await this.reportsService.generateWeeklySiteReport(siteId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=weekly-report-${siteId}.pdf`);
    res.send(pdf);
  }

  @Post('generate-all')
  @Roles('ADMIN')
  async generateAllDailyReports(@CurrentUser() user: any) {
    return this.reportsService.generateAllDailyReports(user.organizationId);
  }

  @Get('guard/:guardId/daily')
  @Roles('ADMIN')
  async getGuardDailyReport(@Param('guardId') guardId: string, @Res() res: Response) {
    const pdf = await this.reportsService.generateGuardDailyReport(guardId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="guard-report-${guardId}.pdf"`,
    });
    res.end(pdf);
  }

  @Get('client/:clientId/pdf')
  @Roles('ADMIN')
  async getClientSummary(@Param('clientId') clientId: string, @Res() res: Response) {
    const pdf = await this.reportsService.generateClientSummary(clientId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="client-summary-${clientId}.pdf"`,
    });
    res.end(pdf);
  }
}
