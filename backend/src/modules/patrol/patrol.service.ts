import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StartPatrolDto, SubmitPatrolLogDto } from './dto/patrol.dto';

// Configurable performance scoring weights
const PERFORMANCE_WEIGHTS = {
  ATTENDANCE: 0.6,
  PATROL: 0.4,
};

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

    // Prevent duplicate in-progress patrols for the same guard
    const existingPatrol = await this.prisma.patrolRecord.findFirst({
      where: { guardId, status: 'IN_PROGRESS' },
    });
    if (existingPatrol) {
      throw new BadRequestException(
        'Guard already has an in-progress patrol. Complete it first.',
      );
    }

    const record = await this.prisma.patrolRecord.create({
      data: {
        routeId: dto.routeId,
        guardId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        scannedCheckpoints: '[]',
        missedCheckpoints: '[]',
      },
    });

    // Write audit log (fire-and-forget)
    this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PATROL_STARTED',
        entity: 'PatrolRecord',
        entityId: record.id,
        newValues: JSON.stringify({ routeId: dto.routeId, guardId }),
        ipAddress: '',
        userAgent: '',
      },
    }).catch(() => {});

    return record;
  }

  async submitLog(
    dto: SubmitPatrolLogDto,
    user: { id: string; organizationId: string },
  ) {
    const guard = await this.prisma.guard.findFirst({
      where: { userId: user.id, organizationId: user.organizationId },
      select: { id: true },
    });

    const patrolRecord = await this.prisma.patrolRecord.findFirst({
      where: {
        id: dto.patrolRecordId,
        ...(guard ? { guardId: guard.id } : {}),
      },
      include: { route: { include: { checkpoints: true } } },
    });

    if (!patrolRecord) throw new NotFoundException('Patrol record not found');
    if (patrolRecord.status === 'COMPLETED')
      throw new BadRequestException('Patrol already completed');

    const expectedCheckpoints = patrolRecord.route.checkpoints.map(
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

    // Create individual PatrolLog entries for each scanned checkpoint
    for (const scan of dto.scans) {
      await this.prisma.patrolLog.create({
        data: {
          patrolRouteId: patrolRecord.routeId,
          checkpointId: scan.checkpointId,
          guardId: patrolRecord.guardId,
          scannedAt: new Date(scan.scanTime),
          latitude: scan.latitude,
          longitude: scan.longitude,
          isLate: false,
          isMissed: false,
        },
      });
    }

    // Create PatrolLog entries for missed checkpoints
    for (const missedId of missedCheckpoints) {
      const checkpoint = patrolRecord.route.checkpoints.find(
        (cp) => cp.id === missedId,
      );
      if (checkpoint) {
        await this.prisma.patrolLog.create({
          data: {
            patrolRouteId: patrolRecord.routeId,
            checkpointId: missedId,
            guardId: patrolRecord.guardId,
            scannedAt: new Date(),
            latitude: checkpoint.expectedLatitude,
            longitude: checkpoint.expectedLongitude,
            isMissed: true,
          },
        });
      }
    }

    const record = await this.prisma.patrolRecord.update({
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

    // Update guard performance score using configurable weights
    if (record.guardId) {
      const totalPatrols = await this.prisma.patrolRecord.count({
        where: { guardId: record.guardId },
      });
      const completedPatrols = await this.prisma.patrolRecord.count({
        where: { guardId: record.guardId, status: 'COMPLETED' },
      });
      const patrolRate =
        totalPatrols > 0
          ? Math.round((completedPatrols / totalPatrols) * 100)
          : 100;

      const guard = await this.prisma.guard.findUnique({
        where: { id: record.guardId },
      });
      if (guard) {
        // Use configurable weights from PERFORMANCE_WEIGHTS
        const newScore = Math.round(
          guard.performanceScore * PERFORMANCE_WEIGHTS.ATTENDANCE +
          patrolRate * PERFORMANCE_WEIGHTS.PATROL,
        );
        await this.prisma.guard.update({
          where: { id: record.guardId },
          data: { performanceScore: Math.max(0, Math.min(100, newScore)) },
        });
      }
    }

    // Write audit log (fire-and-forget)
    this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PATROL_COMPLETED',
        entity: 'PatrolRecord',
        entityId: record.id,
        newValues: JSON.stringify({
          completionPercentage,
          totalCheckpoints: expectedCheckpoints.length,
          scannedCheckpoints: scannedIds.length,
          missedCheckpoints: missedCheckpoints.length,
        }),
        ipAddress: '',
        userAgent: '',
      },
    }).catch(() => {});

    return record;
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
