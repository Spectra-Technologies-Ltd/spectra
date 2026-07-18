import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto';

@Injectable()
export class SiteService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    riskLevel?: string;
    clientId?: string;
    organizationId: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: query.organizationId };
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.clientId) where.clientId = query.clientId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, companyName: true } },
          _count: { select: { guards: true, incidents: true } },
        },
      }),
      this.prisma.site.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;
    const site = await this.prisma.site.findFirst({
      where,
      include: {
        client: true,
        guards: {
          select: {
            id: true,
            fullName: true,
            status: true,
            currentShift: true,
          },
        },
        incidents: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async create(dto: CreateSiteDto, organizationId: string) {
    return this.prisma.site.create({
      data: {
        organizationId,
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        clientId: dto.clientId,
        riskLevel: dto.riskLevel,
        targetGuards: dto.targetGuards,
        supervisorId: dto.supervisorId,
        sitePhotos: '[]',
        emergencyContacts: '[]',
        assets: '[]',
      },
    });
  }

  async update(id: string, dto: UpdateSiteDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.site.update({ where: { id }, data: dto as any });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.site.delete({ where: { id } });
  }
}
