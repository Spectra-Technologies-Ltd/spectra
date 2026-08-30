import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ReportIncidentDto,
  UpdateIncidentDto,
  UpdateIncidentStatusDto,
} from './dto/incident.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtime: RealtimeService,
  ) {}

  async reportIncident(
    dto: ReportIncidentDto,
    user: { id: string; organizationId: string },
  ) {
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, organizationId: user.organizationId },
    });
    if (!site)
      throw new NotFoundException('Site not found in your organization');

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        incidentType: dto.type,
        severity: dto.severity,
        status: 'OPEN',
        occurrenceTime: new Date(),
        siteId: dto.siteId,
        reporterId: user.id,
        reportedAt: new Date(),
        guardsInvolved: JSON.stringify(dto.involvedParties || []),
        photos: JSON.stringify(dto.mediaUrls || []),
        videos: '[]',
        voiceNotes: '[]',
        witnesses: '[]',
        actionsTaken: '',
        investigationStatus: 'OPEN',
      },
    });

    // Trigger notification (fire-and-forget, don't block response)
    this.notifications.sendIncidentAlert({
      incidentId: incident.id,
      type: dto.type,
      severity: dto.severity,
      siteId: dto.siteId,
      siteName: site.name,
      description: dto.description,
    }).catch((err) => this.logger.warn('Notification failed:', err.message));

    // Real-time push to the command center
    this.realtime.publish(user.organizationId, 'incident:created', {
      id: incident.id,
      title: dto.title,
      type: dto.type,
      severity: dto.severity,
      status: 'OPEN',
      siteId: dto.siteId,
      siteName: site.name,
      reportedAt: incident.reportedAt.toISOString(),
    });

    // Write audit log (fire-and-forget)
    this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INCIDENT_CREATED',
        entity: 'Incident',
        entityId: incident.id,
        newValues: JSON.stringify({ type: dto.type, severity: dto.severity }),
        ipAddress: '',
        userAgent: '',
      },
    }).catch((err) => this.logger.warn('Audit log failed:', err.message));

    return incident;
  }

  async updateStatus(
    id: string,
    dto: UpdateIncidentStatusDto,
    organizationId: string,
  ) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, site: { organizationId } },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        investigationStatus: dto.status,
        resolutionNotes: dto.resolutionNotes,
      },
    });
  }

  async update(id: string, dto: UpdateIncidentDto, organizationId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, site: { organizationId } },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.description) data.description = dto.description;
    if (dto.type) data.incidentType = dto.type;
    if (dto.severity) data.severity = dto.severity;
    if (dto.siteId) data.siteId = dto.siteId;
    if (dto.status) {
      data.status = dto.status;
      data.investigationStatus = dto.status;
    }
    if (dto.resolutionNotes !== undefined) data.resolutionNotes = dto.resolutionNotes;
    if (dto.actionsTaken !== undefined) data.actionsTaken = dto.actionsTaken;
    if (dto.mediaUrls) data.photos = JSON.stringify(dto.mediaUrls);
    if (dto.involvedParties) data.guardsInvolved = JSON.stringify(dto.involvedParties);

    return this.prisma.incident.update({ where: { id }, data });
  }

  async getMetrics(query: {
    organizationId: string;
    startDate?: string;
    endDate?: string;
    type?: string;
  }) {
    const { organizationId } = query;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException(`Invalid startDate: "${query.startDate}"`);
    }
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException(`Invalid endDate: "${query.endDate}"`);
    }
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    try {
      // Aggregation filter shared by all metric queries
      const where: Prisma.IncidentWhereInput = {
        site: { organizationId },
        ...(query.type ? { incidentType: query.type } : {}),
        ...(startDate || endDate
          ? {
              reportedAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      };

      // Organization-scoped calendar metrics (daily/weekly ignore the
      // optional date range so they stay "live" stats)
      const orgWhere: Prisma.IncidentWhereInput = {
        site: { organizationId },
        ...(query.type ? { incidentType: query.type } : {}),
      };

      // Current calendar day window (local time)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Run all aggregates in parallel; Prisma compiles these to SQL
      // COUNT / GROUP BY queries backed by the Incident indexes.
      const [total, daily, weekly, open, resolved, byTypeRows, dailyBreakdown] =
        await Promise.all([
          this.prisma.incident.count({ where }),
          this.prisma.incident.count({
            where: {
              ...orgWhere,
              reportedAt: { gte: todayStart, lt: tomorrowStart },
            },
          }),
          this.prisma.incident.count({
            where: { ...orgWhere, reportedAt: { gte: weekAgo } },
          }),
          this.prisma.incident.count({
            where: { ...where, status: { in: ['OPEN', 'INVESTIGATING'] } },
          }),
          this.prisma.incident.count({
            where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } },
          }),
          this.prisma.incident.groupBy({
            by: ['incidentType'],
            where,
            _count: { id: true },
          }),
          this.getDailyBreakdown(where, startDate, endDate),
        ]);

      // { type_name: count } dictionary per the endpoint spec
      const byType: Record<string, number> = {};
      for (const row of byTypeRows) {
        byType[row.incidentType] = row._count.id;
      }

      return {
        total,
        daily,
        weekly,
        open,
        resolved,
        byType,
        dailyBreakdown,
        filters: {
          startDate: query.startDate || null,
          endDate: query.endDate || null,
          type: query.type || null,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to compute incident metrics',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to compute incident metrics',
      );
    }
  }

  /**
   * Time-series of daily incident counts. Defaults to the last 7 days and
   * honors the startDate/endDate range when provided. Bounded to 31 days
   * so the per-day COUNT queries stay cheap.
   */
  private async getDailyBreakdown(
    where: Prisma.IncidentWhereInput,
    startDate?: Date,
    endDate?: Date,
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let from: Date;
    let to: Date;
    if (startDate || endDate) {
      from = new Date(startDate ?? todayStart);
      from.setHours(0, 0, 0, 0);
      to = new Date(endDate ?? todayStart);
      to.setHours(0, 0, 0, 0);
    } else {
      from = new Date(todayStart);
      from.setDate(from.getDate() - 6);
      to = new Date(todayStart);
    }

    // Walk backwards from `to`, keeping at most MAX_DAYS buckets
    const MAX_DAYS = 31;
    const days: Date[] = [];
    for (
      const cursor = new Date(to);
      days.length < MAX_DAYS;
      cursor.setDate(cursor.getDate() - 1)
    ) {
      days.push(new Date(cursor));
      if (cursor.getTime() <= from.getTime()) break;
    }
    days.reverse();

    return Promise.all(
      days.map(async (day) => {
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        const count = await this.prisma.incident.count({
          where: { ...where, reportedAt: { gte: day, lt: nextDay } },
        });
        return { date: this.formatDateKey(day), count };
      }),
    );
  }

  private formatDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    siteId?: string;
    status?: string;
    type?: string;
    search?: string;
    organizationId: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { site: { organizationId: query.organizationId } };
    if (query.siteId) where.siteId = query.siteId;
    if (query.status) where.status = query.status;
    if (query.type) where.incidentType = query.type;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { incidentType: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportedAt: 'desc' },
        include: {
          site: {
            select: {
              id: true,
              name: true,
              client: { select: { companyName: true } },
            },
          },
          reporter: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async remove(id: string, organizationId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, site: { organizationId } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return this.prisma.incident.delete({ where: { id } });
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        site: { include: { client: true } },
        reporter: true,
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }
}
