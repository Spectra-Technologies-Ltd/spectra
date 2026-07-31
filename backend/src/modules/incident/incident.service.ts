import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  ReportIncidentDto,
  UpdateIncidentDto,
  UpdateIncidentStatusDto,
} from './dto/incident.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
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
    const where: any = { site: { organizationId: query.organizationId } };
    if (query.type) where.incidentType = query.type;

    const dateFilter: any = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);
    if (Object.keys(dateFilter).length > 0) where.reportedAt = dateFilter;

    // Total incidents matching the filter
    const total = await this.prisma.incident.count({ where });

    // Incidents reported today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const daily = await this.prisma.incident.count({
      where: { ...where, reportedAt: { gte: today, lt: tomorrow } },
    });

    // Incidents this week
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekly = await this.prisma.incident.count({
      where: { ...where, reportedAt: { gte: weekAgo } },
    });

    // Incidents by type
    const byType = await this.prisma.incident.groupBy({
      by: ['incidentType'],
      where,
      _count: { id: true },
    });

    // Open vs resolved
    const open = await this.prisma.incident.count({
      where: {
        ...where,
        status: { in: ['OPEN', 'INVESTIGATING'] },
      },
    });
    const resolved = await this.prisma.incident.count({
      where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } },
    });

    return {
      total,
      daily,
      weekly,
      open,
      resolved,
      byType: byType.map((i) => ({
        type: i.incidentType,
        count: i._count.id,
      })),
      filters: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
        type: query.type || null,
      },
    };
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
