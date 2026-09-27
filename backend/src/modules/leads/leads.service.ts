import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export interface LeadMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class LeadsService {
  private readonly logger = new Logger('Leads');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a public-site submission.
   *
   * Newsletter signups are idempotent — re-subscribing returns the existing row
   * instead of creating a duplicate, which is what a visitor expects.
   */
  async create(dto: CreateLeadDto, meta: LeadMeta = {}) {
    const email = dto.email.trim().toLowerCase();
    const kind = dto.kind;

    if (kind === 'NEWSLETTER') {
      const existing = await this.prisma.lead.findFirst({
        where: { email, kind: 'NEWSLETTER' },
      });
      if (existing) {
        this.logger.log(`Newsletter signup already recorded for ${email}`);
        return { ...existing, duplicate: true };
      }
    }

    const lead = await this.prisma.lead.create({
      data: {
        kind,
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        organization: dto.organizationName,
        jobTitle: dto.jobTitle,
        country: dto.country,
        subject: dto.subject,
        context: dto.context,
        message: dto.message,
        // Verbatim copy of everything submitted, so a field added to a form
        // before the schema is never lost.
        payload: JSON.stringify(dto),
        source: dto.source?.trim() || `landing:${kind.toLowerCase()}`,
        ipAddress: meta.ip,
        userAgent: meta.userAgent?.slice(0, 500),
        status: 'NEW',
      },
    });

    this.logger.log(`Captured ${kind} lead ${lead.id} from ${email}`);
    return lead;
  }

  async findAll(query: {
    kind?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const take = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(query.limit || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      ),
    );

    const where: Record<string, unknown> = {};
    if (query.kind) where.kind = query.kind;
    if (query.status) where.status = query.status;
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        total,
        page,
        limit: take,
        pages: Math.max(1, Math.ceil(total / take)),
      },
    };
  }

  async getStats() {
    const [byKind, byStatus, total, last7Days] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['kind'], _count: { _all: true } }),
      this.prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.lead.count(),
      this.prisma.lead.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const toMap = <T extends Record<string, unknown>>(
      rows: T[],
      key: keyof T,
    ) =>
      rows.reduce<Record<string, number>>((acc, row) => {
        const count = (row._count as { _all: number } | undefined)?._all ?? 0;
        acc[String(row[key])] = count;
        return acc;
      }, {});

    return {
      total,
      last7Days,
      byKind: toMap(byKind, 'kind'),
      byStatus: toMap(byStatus, 'status'),
    };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, userId?: string) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.status) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status && userId) {
      data.handledById = userId;
      data.handledAt = new Date();
    }

    return this.prisma.lead.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.lead.delete({ where: { id } });
    return { success: true, id };
  }
}
