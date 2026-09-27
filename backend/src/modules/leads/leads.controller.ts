import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Public. Called server-to-server by the marketing site's route handlers
   * (`app/api/contact|demo|newsletter`) — never directly by a browser, which is
   * why CORS does not apply here. Protected by per-IP rate limiting in
   * SecurityMiddleware.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLeadDto, @Req() req: Request) {
    const lead = await this.leadsService.create(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Deliberately narrow: never echo the stored payload or client metadata.
    return {
      ok: true,
      id: lead.id,
      kind: lead.kind,
      duplicate: 'duplicate' in lead ? Boolean(lead.duplicate) : false,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(@Query() query: ListLeadsQueryDto) {
    return this.leadsService.findAll(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  stats() {
    return this.leadsService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.leadsService.update(id, dto, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
