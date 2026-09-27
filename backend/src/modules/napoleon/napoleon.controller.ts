import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { NapoleonService } from './napoleon.service';

@Controller('napoleon')
@UseGuards(JwtAuthGuard)
export class NapoleonController {
  constructor(private napoleon: NapoleonService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.napoleon.getOverview(user.organizationId);
  }

  @Get('risk-by-site')
  getRiskBySite(@CurrentUser() user: AuthenticatedUser) {
    return this.napoleon.getRiskBySite(user.organizationId);
  }

  @Get('at-risk-guards')
  getAtRiskGuards(@CurrentUser() user: AuthenticatedUser) {
    return this.napoleon.getAtRiskGuards(user.organizationId);
  }
}
