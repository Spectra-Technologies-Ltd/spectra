import {
  Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

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

  @Get('history')
  @Roles('ADMIN')
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('siteId') siteId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getAttendanceHistory({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      siteId, date, organizationId: user.organizationId,
    });
  }
}
