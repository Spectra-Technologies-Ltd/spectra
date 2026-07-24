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
        assignedSupervisor: {
          select: { id: true, firstName: true, lastName: true },
        },
        attendances: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { site: { select: { name: true } } },
        },
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
        trainingRecords: dto.trainingRecords || '[]',
        certificates: dto.certificates || '[]',
        backgroundVerification: dto.backgroundVerification || '{"status":"PENDING"}',
        disciplinaryHistory: dto.disciplinaryHistory || '[]',
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

  async remove(id: string, organizationId: string, userId?: string) {
    await this.findOne(id, organizationId);
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete attendance records
      await tx.attendance.deleteMany({ where: { guardId: id } });
      // Delete patrol records
      await tx.patrolRecord.deleteMany({ where: { guardId: id } });
      // Delete patrol logs
      await tx.patrolLog.deleteMany({ where: { guardId: id } });
      // Unlink guard from patrol routes
      await tx.patrolRoute.updateMany({
        where: { assignedGuardId: id },
        data: { assignedGuardId: null },
      });
      // Delete the guard
      return tx.guard.delete({ where: { id } });
    });

    // Write audit log (fire-and-forget)
    this.prisma.auditLog.create({
      data: {
        userId: userId || '',
        action: 'GUARD_DELETED',
        entity: 'Guard',
        entityId: id,
        ipAddress: '',
        userAgent: '',
      },
    }).catch(() => {});

    return result;
  }

  async bulkAssign(dto: { siteId: string; guardIds: string[] }, organizationId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, organizationId },
    });
    if (!site) throw new NotFoundException('Site not found');

    await this.prisma.guard.updateMany({
      where: { id: { in: dto.guardIds }, organizationId },
      data: { assignedSiteId: dto.siteId },
    });

    return { message: `${dto.guardIds.length} guards assigned to ${site.name}` };
  }

  async updateVerification(id: string, dto: { status: string; verifiedBy?: string; date?: string }, organizationId: string) {
    await this.findOne(id, organizationId);
    const existing = JSON.parse((await this.prisma.guard.findUnique({ where: { id }, select: { backgroundVerification: true } }))?.backgroundVerification || '{}');
    const updated = {
      ...existing,
      status: dto.status,
      verifiedBy: dto.verifiedBy || existing.verifiedBy || '',
      date: dto.date || new Date().toISOString(),
    };
    return this.prisma.guard.update({
      where: { id },
      data: { backgroundVerification: JSON.stringify(updated) },
    });
  }

  async findUnassigned(organizationId: string) {
    return this.prisma.guard.findMany({
      where: { organizationId, assignedSiteId: null, status: 'ACTIVE' },
      select: { id: true, fullName: true, currentShift: true },
    });
  }

  async findWithAttendanceStats(date: string, organizationId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const guards = await this.prisma.guard.findMany({
      where: { organizationId },
      include: {
        assignedSite: { select: { id: true, name: true } },
        attendances: {
          where: { checkInTime: { gte: startOfDay, lte: endOfDay } },
          take: 1,
          orderBy: { checkInTime: 'desc' },
        },
      },
    });

    return guards.map(g => ({
      id: g.id,
      fullName: g.fullName,
      status: g.status,
      currentShift: g.currentShift,
      siteName: g.assignedSite?.name || null,
      checkedIn: g.attendances.length > 0,
      checkInTime: g.attendances[0]?.checkInTime || null,
      checkInStatus: g.attendances[0]?.status || null,
    }));
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
