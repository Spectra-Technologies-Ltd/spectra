import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GuardService } from './guard.service';
import {
  CreateGuardDto,
  UpdateGuardDto,
  TransferGuardDto,
} from './dto/guard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('guards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardController {
  constructor(private guardService: GuardService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('siteId') siteId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.guardService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      siteId,
      search,
      sortBy,
      sortOrder,
      organizationId: user.organizationId,
    });
  }

  @Get('stats')
  @Roles('ADMIN')
  async getStats(@CurrentUser() user: any) {
    return this.guardService.getStats(user.organizationId);
  }

  @Get('unassigned')
  @Roles('ADMIN')
  async findUnassigned(@CurrentUser() user: any) {
    return this.guardService.findUnassigned(user.organizationId);
  }

  @Get('attendance-stats')
  @Roles('ADMIN')
  async findWithAttendanceStats(@CurrentUser() user: any, @Query('date') date?: string) {
    return this.guardService.findWithAttendanceStats(date || new Date().toISOString().split('T')[0], user.organizationId);
  }

  @Post('bulk-assign')
  @Roles('ADMIN')
  async bulkAssign(@Body() dto: { siteId: string; guardIds: string[] }, @CurrentUser() user: any) {
    return this.guardService.bulkAssign(dto, user.organizationId);
  }

  @Get(':id')
  @Roles('ADMIN', 'EMPLOYEE')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.guardService.findOne(id, user.organizationId);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGuardDto, @CurrentUser() user: any) {
    return this.guardService.create(dto, user.organizationId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGuardDto,
    @CurrentUser() user: any,
  ) {
    return this.guardService.update(id, dto, user.organizationId);
  }

  @Post(':id/transfer')
  @Roles('ADMIN')
  async transfer(
    @Param('id') id: string,
    @Body() dto: TransferGuardDto,
    @CurrentUser() user: any,
  ) {
    return this.guardService.transfer(id, dto, user.organizationId);
  }

  @Patch(':id/verification')
  @Roles('ADMIN')
  async updateVerification(
    @Param('id') id: string,
    @Body() dto: { status: string; verifiedBy?: string; date?: string },
    @CurrentUser() user: any,
  ) {
    return this.guardService.updateVerification(id, dto, user.organizationId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.guardService.remove(id, user.organizationId, user.id);
  }
}
