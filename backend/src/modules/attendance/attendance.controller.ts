import {
  Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus, Header, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private prisma: PrismaService,
  ) {}

  @Post('check-in')
  @Roles('EMPLOYEE')
  @HttpCode(HttpStatus.CREATED)
  async checkIn(@Body() dto: CheckInDto, @CurrentUser() user: any) {
    return this.attendanceService.checkIn(dto, user);
  }

  @Post('check-out')
  @Roles('EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  async checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: any) {
    return this.attendanceService.checkOut(dto, user);
  }

  @Post('mark-absent')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async markAbsent(
    @CurrentUser() user: any,
    @Body() dto: { date?: string },
  ) {
    const count = await this.attendanceService.markAbsentGuards(
      user.organizationId,
      dto.date,
    );
    return { message: `${count} guards marked as absent`, count };
  }

  @Get('me')
  async getMyStatus(@CurrentUser() user: any) {
    const guard = await this.prisma.guard.findUnique({
      where: { userId: user.id },
      select: { id: true, fullName: true, assignedSiteId: true },
    });
    if (!guard) return { hasGuardProfile: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = await this.prisma.attendance.findFirst({
      where: { guardId: guard.id, createdAt: { gte: today }, checkOutTime: null },
      orderBy: { createdAt: 'desc' },
    });
    const latest = await this.prisma.attendance.findFirst({
      where: { guardId: guard.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    return {
      hasGuardProfile: true,
      checkedIn: Boolean(active),
      activeCheckIn: active
        ? {
            id: active.id,
            time: active.checkInTime.toISOString(),
            status: active.status,
            isLate: active.isLate,
            verified: active.verifiedStatus,
          }
        : null,
      lastStatus: latest ? { status: latest.status, isLate: latest.isLate, at: latest.createdAt.toISOString() } : null,
    };
  }

  @Get('history')
  @Roles('ADMIN')
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('siteId') siteId?: string,
    @Query('date') date?: string,
    @Query('guardId') guardId?: string,
  ) {
    return this.attendanceService.getAttendanceHistory({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      siteId, date, guardId, organizationId: user.organizationId,
    });
  }

  @Get('export')
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @Res() res: Response,
    @CurrentUser() user: any,
    @Query('date') date?: string,
    @Query('siteId') siteId?: string,
  ) {
    const csv = await this.attendanceService.exportCsv({
      organizationId: user.organizationId,
      date,
      siteId,
    });
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance-${date ?? 'all'}.csv"`,
    );
    res.send(csv);
  }
}
