import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StartPatrolDto, SubmitPatrolLogDto } from './dto/patrol.dto';

@Injectable()
export class PatrolService {
  constructor(private prisma: PrismaService) {}

  async getRoutes(siteId: string, organizationId: string) {
    return this.prisma.patrolRoute.findMany({
      where: { siteId, site: { organizationId } },
      include: {
        checkpoints: { orderBy: { sequenceOrder: 'asc' } },
      },
    });
  }

  async startPatrol(
    dto: StartPatrolDto,
    user: { id: string; organizationId: string },
  ) {
    const route = await this.prisma.patrolRoute.findFirst({
      where: { id: dto.routeId, site: { organizationId: user.organizationId } },
      include: { checkpoints: true },
    });
    if (!route) throw new NotFoundException('Patrol route not found');

    const guardId =
      dto.guardId ??
      (
        await this.prisma.guard.findFirst({
          where: { userId: user.id, organizationId: user.organizationId },
          select: { id: true },
        })
      )?.id;
    if (!guardId)
      throw new NotFoundException('Guard profile not found for this employee');

    return this.prisma.patrolRecord.create({
      data: {
        routeId: dto.routeId,
        guardId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        scannedCheckpoints: '[]',
        missedCheckpoints: '[]',
      },
    });
  }

  async submitLog(
    dto: SubmitPatrolLogDto,
    user: { id: string; organizationId: string },
  ) {
    const guard = await this.prisma.guard.findFirst({
      where: { userId: user.id, organizationId: user.organizationId },
      select: { id: true },
    });

    const record = await this.prisma.patrolRecord.findFirst({
      where: {
        id: dto.patrolRecordId,
        ...(guard ? { guardId: guard.id } : {}),
      },
      include: { route: { include: { checkpoints: true } } },
    });

    if (!record) throw new NotFoundException('Patrol record not found');
    if (record.status === 'COMPLETED')
      throw new BadRequestException('Patrol already completed');

    const expectedCheckpoints = record.route.checkpoints.map(
      (checkpoint: { id: string }) => checkpoint.id,
    );
    const scannedIds = dto.scans.map(
      (scan: { checkpointId: string }) => scan.checkpointId,
    );

    const missedCheckpoints = expectedCheckpoints.filter(
      (id: string) => !scannedIds.includes(id),
    );
    const completionPercentage =
      expectedCheckpoints.length > 0
        ? (scannedIds.length / expectedCheckpoints.length) * 100
        : 0;

    return this.prisma.patrolRecord.update({
      where: { id: dto.patrolRecordId },
      data: {
        endTime: new Date(),
        status: 'COMPLETED',
        scannedCheckpoints: JSON.stringify(dto.scans),
        missedCheckpoints: JSON.stringify(missedCheckpoints),
        completionPercentage,
        incidentReportId: dto.incidentReportId,
        generalNotes: dto.generalNotes,
      },
    });
  }

  async getPatrolHistory(query: {
    page?: number;
    limit?: number;
    siteId?: string;
    guardId?: string;
    organizationId: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      route: { site: { organizationId: query.organizationId } },
    };
    if (query.guardId) where.guardId = query.guardId;
    if (query.siteId) where.route = { ...where.route, siteId: query.siteId };

    const [data, total] = await Promise.all([
      this.prisma.patrolRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          guard: { select: { id: true, fullName: true } },
          route: {
            select: {
              id: true,
              name: true,
              site: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.patrolRecord.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}
