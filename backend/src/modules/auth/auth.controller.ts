import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { TfaService } from './tfa.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tfa: TfaService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createEmployee(@Body() dto: RegisterDto, @CurrentUser() user: any) {
    return this.authService.createEmployee(dto, user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // 2FA gate: no cookies yet, just hand back the step-two token
    if (result.requiresTwoFactor) {
      return { requiresTwoFactor: true, tfaToken: result.tfaToken };
    }

    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });

    return { user: result.user };
  }

  @Post('tfa/login')
  @HttpCode(HttpStatus.OK)
  async tfaLogin(
    @Body() dto: { tfaToken: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.completeTfaLogin(dto.tfaToken, dto.code);

    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return { user: result.user };
  }

  @Get('tfa/status')
  @UseGuards(JwtAuthGuard)
  async tfaStatus(@CurrentUser() user: any) {
    const record = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });
    return { enabled: record?.twoFactorEnabled ?? false };
  }

  @Post('tfa/enable')
  @UseGuards(JwtAuthGuard)
  async tfaEnable(@CurrentUser() user: any) {
    return this.tfa.startEnrollment(user.id, user.email);
  }

  @Post('tfa/confirm')
  @UseGuards(JwtAuthGuard)
  async tfaConfirm(
    @CurrentUser() user: any,
    @Body() dto: { code: string },
  ) {
    return this.tfa.confirmEnrollment(user.id, dto.code);
  }

  @Post('tfa/disable')
  @UseGuards(JwtAuthGuard)
  async tfaDisable(
    @CurrentUser() user: any,
    @Body() dto: { code: string },
  ) {
    return this.tfa.disable(user.id, dto.code);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    const result = await this.authService.refresh(refreshToken);

    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(user.id, refreshToken);

    res.clearCookie('access_token', { ...COOKIE_OPTIONS });
    res.clearCookie('refresh_token', {
      ...COOKIE_OPTIONS,
      path: '/api/v1/auth',
    });

    return { message: 'Logged out successfully' };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: { firstName?: string; lastName?: string; phone?: string; email?: string; photoUrl?: string },
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }
}
