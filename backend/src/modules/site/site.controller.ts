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
import { SiteService } from './site.service';
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteController {
  constructor(private siteService: SiteService) {}

  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.siteService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      riskLevel,
      clientId,
      organizationId: user.organizationId,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'EMPLOYEE')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.siteService.findOne(id, user.organizationId);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSiteDto, @CurrentUser() user: any) {
    return this.siteService.create(dto, user.organizationId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @CurrentUser() user: any,
  ) {
    return this.siteService.update(id, dto, user.organizationId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.siteService.remove(id, user.organizationId, user.id);
  }
}
