import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateGuardDto,
  UpdateGuardDto,
  TransferGuardDto,
} from './dto/guard.dto';

@Injectable()
export class GuardService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    siteId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    organizationId: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: query.organizationId };
    if (query.status) where.status = query.status;
    if (query.siteId) where.assignedSiteId = query.siteId;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { nin: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.guard.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { assignedSite: { select: { id: true, name: true } } },
      }),
      this.prisma.guard.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;
    const guard = await this.prisma.guard.findFirst({
      where,
      include: {
        assignedSite: true,
        attendances: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!guard) throw new NotFoundException('Guard not found');
    return guard;
  }

  async create(dto: CreateGuardDto, organizationId: string) {
    return this.prisma.guard.create({
      data: {
        organizationId,
        fullName: dto.fullName,
        photoUrl: dto.photoUrl || '',
        phone: dto.phone,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
        nin: dto.nin,
        bvn: dto.bvn,
        guarantorDetails: dto.guarantorDetails,
        employmentDate: new Date(dto.employmentDate),
        status: dto.status,
        currentShift: dto.currentShift,
        assignedSiteId: dto.assignedSiteId,
        assignedSupervisorId: dto.assignedSupervisorId,
        trainingRecords: '[]',
        certificates: '[]',
        backgroundVerification: '{"status":"PENDING"}',
        disciplinaryHistory: '[]',
      },
    });
  }

  async update(id: string, dto: UpdateGuardDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.guard.update({ where: { id }, data: dto as any });
  }

  async transfer(id: string, dto: TransferGuardDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.guard.update({
      where: { id },
      data: {
        assignedSiteId: dto.newSiteId,
        assignedSupervisorId: dto.newSupervisorId,
      },
    });
  }

  async deactivate(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.guard.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getStats(organizationId: string) {
    const [total, active, onLeave, suspended] = await Promise.all([
      this.prisma.guard.count({ where: { organizationId } }),
      this.prisma.guard.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.guard.count({
        where: { organizationId, status: 'ON_LEAVE' },
      }),
      this.prisma.guard.count({
        where: { organizationId, status: 'SUSPENDED' },
      }),
    ]);
    return {
      total,
      active,
      onLeave,
      suspended,
      inactive: total - active - onLeave - suspended,
    };
  }
}
