import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { BadgeCheckInDto, BadgeProfileDto } from './dto/badge.dto';

/**
 * Public, badge-authenticated attendance.
 *
 * Guards have no accounts, so there is deliberately no session here: the token
 * read from the card IS the credential. Every action required a fresh tap —
 * nothing is stored on the device. Rate limiting is applied in
 * SecurityMiddleware for `/api/v1/badge/*`.
 */
@Controller('badge')
export class BadgeController {
  constructor(private attendance: AttendanceService) {}

  @Post('check-in')
  @HttpCode(HttpStatus.CREATED)
  checkIn(@Body() dto: BadgeCheckInDto) {
    return this.attendance.badgeCheckIn(dto);
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  profile(@Body() dto: BadgeProfileDto) {
    return this.attendance.badgeProfile(dto.token);
  }
}
