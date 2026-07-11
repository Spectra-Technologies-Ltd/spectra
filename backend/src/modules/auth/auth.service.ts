import { Injectable, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      throw new ForbiddenException('Public registration is disabled. Ask an admin to create your employee account.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email address is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const organization = await this.prisma.organization.create({
      data: { name: dto.organizationName || 'Spectra Operations' },
    });

    const user = await this.prisma.user.create({
      data: {
        organizationId: organization.id,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'ADMIN',
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async createEmployee(dto: RegisterDto, admin: { organizationId: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email address is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        organizationId: admin.organizationId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        organizationId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
    const accessToken = this.jwtService.sign(payload);

    // Generate and store refresh token
    const rawToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawToken,
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old token, issue new one
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const payload = {
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      organizationId: stored.user.organizationId,
    };
    const newAccessToken = this.jwtService.sign(payload);

    const newRawToken = this.generateRefreshToken();
    const newTokenHash = this.hashToken(newRawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: stored.user.id, tokenHash: newTokenHash, expiresAt },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawToken,
      user: {
        id: stored.user.id,
        organizationId: stored.user.organizationId,
        email: stored.user.email,
        firstName: stored.user.firstName,
        lastName: stored.user.lastName,
        role: stored.user.role,
      },
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    } else {
      // Delete ALL refresh tokens for this user (logout from all devices)
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        guardProfile: {
          select: {
            id: true,
            assignedSiteId: true,
            assignedSite: { select: { id: true, name: true } },
          },
        },
        clientProfile: { select: { id: true, companyName: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User session details could not be found');
    }
    return user;
  }
}
