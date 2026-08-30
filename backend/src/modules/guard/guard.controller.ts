import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Header,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Get('performance')
  @Roles('ADMIN')
  async getPerformance(@CurrentUser() user: any) {
    return this.guardService.getPerformance(user.organizationId);
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

  // ── Bulk import ────────────────────────────────────────────────────────────

  @Get('import/template')
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async importTemplate(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="guards-import-template.csv"',
    );
    res.send(this.guardService.buildCsvTemplate());
  }

  @Post('import')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async importGuards(
    @Body()
    body: {
      rows: Record<string, any>[];
      createAccounts?: boolean;
      mode?: 'create' | 'upsert';
    },
    @CurrentUser() user: any,
  ) {
    if (!body?.rows?.length) {
      return {
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        accountsCreated: 0,
        createdAccounts: [],
        errors: [{ row: 0, reason: 'No rows provided' }],
        errorsTruncated: false,
      };
    }
    return this.guardService.importGuards({
      rows: body.rows,
      createAccounts: body.createAccounts,
      mode: body.mode,
      organizationId: user.organizationId,
    });
  }

  @Post('import/csv')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { createAccounts?: string; mode?: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      return { error: 'Upload a CSV file with the field named "file"' };
    }
    const text = file.buffer?.toString('utf8') ?? '';
    const rows = this.guardService.importFromCsv(text, user.organizationId);
    return this.guardService.importGuards({
      rows,
      createAccounts: body.createAccounts === 'true',
      mode: (body.mode as 'create' | 'upsert') ?? 'create',
      organizationId: user.organizationId,
    });
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
