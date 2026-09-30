import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NfcService } from './nfc.service';
import { AssignCardDto, IssueCardDto } from './dto/nfc.dto';

/**
 * NFC badge management. Issuing returns a server-generated token that the
 * browser then writes to a blank card; check-in validates that token.
 */
@Controller('nfc-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NfcController {
  constructor(private nfc: NfcService) {}

  /** Issue a card (with its token) ready to write to a blank tag. */
  @Post('issue')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  issue(@CurrentUser() user: any, @Body() dto: IssueCardDto) {
    return this.nfc.issue(user.organizationId, dto);
  }

  @Post(':id/assign')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  assign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AssignCardDto,
  ) {
    return this.nfc.assign(user.organizationId, id, dto.guardId);
  }

  @Post(':id/revoke')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.nfc.revoke(user.organizationId, id);
  }

  /** Remove a card — used when writing to a blank physically failed. */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.nfc.remove(user.organizationId, id);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.nfc.list(user.organizationId);
  }
}
