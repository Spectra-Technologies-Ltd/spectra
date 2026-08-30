import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    billingStatus?: string;
    organizationId: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: query.organizationId };
    if (query.billingStatus) where.billingStatus = query.billingStatus;
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { estateName: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sites: { select: { id: true, name: true } } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;
    const client = await this.prisma.client.findFirst({
      where,
      include: { sites: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  /** Full data bundle for a client — sites, incidents and attendance summary. */
  async exportData(id: string, organizationId?: string) {
    const client = await this.findOne(id, organizationId);
    const sites = await this.prisma.site.findMany({
      where: { clientId: id },
      include: {
        _count: { select: { guards: true, incidents: true } },
        incidents: {
          orderBy: { reportedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            title: true,
            incidentType: true,
            severity: true,
            status: true,
            reportedAt: true,
            description: true,
          },
        },
      },
    });
    const attendance = await this.prisma.attendance.findMany({
      where: { site: { clientId: id } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        isLate: true,
        checkInTime: true,
        checkOutTime: true,
        guard: { select: { fullName: true } },
        site: { select: { name: true } },
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      client: {
        id: client.id,
        companyName: client.companyName,
        estateName: client.estateName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        contractStart: client.contractStart,
        contractEnd: client.contractEnd,
        monthlyFee: client.monthlyFee,
        numberOfGuardsAllocated: client.numberOfGuardsAllocated,
        billingStatus: client.billingStatus,
      },
      sites,
      recentAttendance: attendance,
    };
  }

  async create(dto: CreateClientDto, organizationId: string) {
    return this.prisma.client.create({
      data: {
        organizationId,
        companyName: dto.companyName,
        estateName: dto.estateName,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        contractStart: new Date(dto.contractStart),
        contractEnd: new Date(dto.contractEnd),
        monthlyFee: dto.monthlyFee,
        numberOfGuardsAllocated: dto.numberOfGuardsAllocated,
        assignedSupervisorId: dto.assignedSupervisorId,
        billingStatus: dto.billingStatus,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateClientDto, organizationId: string) {
    await this.findOne(id, organizationId);
    const data: any = { ...dto };
    if (dto.contractEnd) data.contractEnd = new Date(dto.contractEnd);
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string, userId?: string) {
    await this.findOne(id, organizationId);
    const result = await this.prisma.$transaction(async (tx) => {
      // Find all sites belonging to this client
      const sites = await tx.site.findMany({ where: { clientId: id } });
      const siteIds = sites.map((s) => s.id);

      if (siteIds.length > 0) {
        // Unlink guards from these sites
        await tx.guard.updateMany({
          where: { assignedSiteId: { in: siteIds } },
          data: { assignedSiteId: null },
        });
        // Delete attendance records, patrol routes, incidents for these sites
        await tx.attendance.deleteMany({
          where: { siteId: { in: siteIds } },
        });
        await tx.patrolLog.deleteMany({
          where: { patrolRoute: { siteId: { in: siteIds } } },
        });
        await tx.patrolRecord.deleteMany({
          where: { route: { siteId: { in: siteIds } } },
        });
        await tx.patrolCheckpoint.deleteMany({
          where: { patrolRoute: { siteId: { in: siteIds } } },
        });
        await tx.patrolRoute.deleteMany({
          where: { siteId: { in: siteIds } },
        });
        await tx.incident.deleteMany({
          where: { siteId: { in: siteIds } },
        });
        // Delete the sites
        await tx.site.deleteMany({ where: { id: { in: siteIds } } });
      }

      // Delete the client
      return tx.client.delete({ where: { id } });
    });

    // Write audit log (fire-and-forget)
    this.prisma.auditLog.create({
      data: {
        userId: userId || '',
        action: 'CLIENT_DELETED',
        entity: 'Client',
        entityId: id,
        ipAddress: '',
        userAgent: '',
      },
    }).catch(() => {});

    return result;
  }
}
