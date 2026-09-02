import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId ?? null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId ?? '',
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          ipAddress: data.ipAddress ?? '',
          userAgent: data.userAgent ?? '',
        },
      });
    } catch {
      // Audit logging must never break the main request
    }
  }

  async findAll(opts: {
    page?: number;
    limit?: number;
    search?: string;
    entity?: string;
    userId?: string;
  }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const where: Record<string, unknown> = {};
    if (opts.search) {
      where.OR = [
        { action: { contains: opts.search, mode: 'insensitive' } },
        { entity: { contains: opts.search, mode: 'insensitive' } },
        { entityId: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    if (opts.entity) where.entity = opts.entity;
    if (opts.userId) where.userId = opts.userId;

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }
}
