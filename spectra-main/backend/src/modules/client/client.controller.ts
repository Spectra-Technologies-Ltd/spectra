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
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private clientService: ClientService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('billingStatus') billingStatus?: string,
  ) {
    return this.clientService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      billingStatus,
      organizationId: user.organizationId,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'EMPLOYEE')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientService.findOne(id, user.organizationId);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateClientDto, @CurrentUser() user: any) {
    return this.clientService.create(dto, user.organizationId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: any,
  ) {
    return this.clientService.update(id, dto, user.organizationId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientService.remove(id, user.organizationId);
  }
}
