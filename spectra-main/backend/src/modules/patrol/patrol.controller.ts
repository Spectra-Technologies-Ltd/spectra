import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatrolService } from './patrol.service';
import { StartPatrolDto, SubmitPatrolLogDto } from './dto/patrol.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('patrols')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatrolController {
  constructor(private patrolService: PatrolService) {}

  @Get('routes/:siteId')
  @Roles('ADMIN', 'EMPLOYEE')
  async getRoutes(@Param('siteId') siteId: string, @CurrentUser() user: any) {
    return this.patrolService.getRoutes(siteId, user.organizationId);
  }

  @Post('start')
  @Roles('EMPLOYEE')
  @HttpCode(HttpStatus.CREATED)
  async startPatrol(@Body() dto: StartPatrolDto, @CurrentUser() user: any) {
    return this.patrolService.startPatrol(dto, user);
  }

  @Post('submit')
  @Roles('EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  async submitLog(@Body() dto: SubmitPatrolLogDto, @CurrentUser() user: any) {
    return this.patrolService.submitLog(dto, user);
  }

  @Get('history')
  @Roles('ADMIN', 'EMPLOYEE')
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('siteId') siteId?: string,
    @Query('guardId') guardId?: string,
  ) {
    return this.patrolService.getPatrolHistory({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      siteId,
      guardId,
      organizationId: user.organizationId,
    });
  }
}
