import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReportIncidentDto, UpdateIncidentStatusDto } from './dto/incident.dto';
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
        resolutionNotes: dto.resolutionNotes,
      },
    });
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
