import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
}
