import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { ReportIncidentDto, UpdateIncidentStatusDto } from './dto/incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentController {
  constructor(private incidentService: IncidentService) {}

  @Post()
  @Roles('EMPLOYEE', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async reportIncident(
    @Body() dto: ReportIncidentDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentService.reportIncident(dto, user);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentService.updateStatus(id, dto, user.organizationId);
  }

  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.incidentService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      siteId,
      status,
      type,
      search,
      organizationId: user.organizationId,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'EMPLOYEE')
  async findOne(@Param('id') id: string) {
    return this.incidentService.findOne(id);
  }
}
