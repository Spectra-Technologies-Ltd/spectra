import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateGuardDto,
  UpdateGuardDto,
  TransferGuardDto,
} from './dto/guard.dto';

// Header aliases accepted in import CSVs (case-insensitive)
const FIELD_ALIASES: Record<string, string> = {
  'full name': 'fullName',
  name: 'fullName',
  'employee name': 'fullName',
  nin: 'nin',
  'national id': 'nin',
  phone: 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  address: 'address',
  'emergency contact': 'emergencyContact',
  'next of kin': 'emergencyContact',
  bvn: 'bvn',
  'guarantor details': 'guarantorDetails',
  guarantor: 'guarantorDetails',
  'employment date': 'employmentDate',
  'start date': 'employmentDate',
  'date joined': 'employmentDate',
  status: 'status',
  shift: 'currentShift',
  'current shift': 'currentShift',
  site: 'siteName',
  'site name': 'siteName',
  'assigned site': 'siteName',
  email: 'email',
  password: 'password',
};

/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

/** Map a CSV header row to canonical field names. */
function mapHeaders(headers: string[]): string[] {
  return headers.map((h) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, ' ');
    return FIELD_ALIASES[key] ?? key.replace(/[^a-z0-9]/g, '');
  });
}

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

  /**
   * Compute a performance score per guard from attendance, patrol and
   * incident data, persist it, and return the ranked list.
   */
  async getPerformance(organizationId: string) {
    const guards = await this.prisma.guard.findMany({
      where: { organizationId },
      select: {
        id: true,
        fullName: true,
        status: true,
        performanceScore: true,
        assignedSite: { select: { name: true } },
        _count: {
          select: { attendances: true, patrolRecords: true },
        },
        attendances: {
          select: { isLate: true },
        },
        patrolRecords: {
          select: { completionPercentage: true },
        },
      },
    });

    const scored = guards.map((g) => {
      const late = g.attendances.filter((a) => a.isLate).length;
      const totalAtt = g.attendances.length;
      const attRate =
        totalAtt > 0 ? Math.round(((totalAtt - late) / totalAtt) * 100) : 100;
      const avgCompletion =
        g.patrolRecords.length > 0
          ? Math.round(
              g.patrolRecords.reduce(
                (s, p) => s + p.completionPercentage,
                0,
              ) / g.patrolRecords.length,
            )
          : 100;
      const score = Math.max(
        40,
        Math.min(99, Math.round(attRate * 0.5 + avgCompletion * 0.5)),
      );

      return {
        id: g.id,
        fullName: g.fullName,
        status: g.status,
        site: g.assignedSite?.name ?? '—',
        attendanceRate: attRate,
        patrolCompletion: avgCompletion,
        lateCheckIns: late,
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    // Persist the computed scores
    for (const item of scored) {
      if (item.score !== 100) {
        await this.prisma.guard.update({
          where: { id: item.id },
          data: { performanceScore: item.score },
        });
      }
    }

    return scored;
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

  // ── Bulk import ────────────────────────────────────────────────────────────

  /**
   * Bulk-create (or upsert) guards from an array of row objects. Optionally
   * creates login accounts (role GUARD) so imported personnel can use the
   * mobile app immediately. Returns a per-row result report.
   */
  async importGuards(opts: {
    rows: Record<string, any>[];
    createAccounts?: boolean;
    mode?: 'create' | 'upsert';
    organizationId: string;
  }) {
    const { rows, organizationId } = opts;
    const mode = opts.mode ?? 'create';
    const createAccounts = opts.createAccounts ?? false;
    const maxErrors = 200;

    const errors: { row: number; reason: string }[] = [];
    const createdAccounts: { email: string; password: string }[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Cache sites by name for friendly siteName resolution
    const sites = await this.prisma.site.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });
    const siteByName = new Map(sites.map((s) => [s.name.toLowerCase().trim(), s.id]));

    const pushError = (row: number, reason: string) => {
      if (errors.length < maxErrors) errors.push({ row, reason });
    };

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i] ?? {};
      const rowNo = i + 2; // 1-based data row (header is row 1)

      try {
        const fullName = String(raw.fullName ?? '').trim();
        const nin = String(raw.nin ?? '').trim();
        const phone = String(raw.phone ?? '').trim();
        const email = String(raw.email ?? '').trim().toLowerCase();

        if (!fullName || !nin || !phone) {
          pushError(rowNo, 'fullName, nin and phone are required');
          skipped++;
          continue;
        }

        // Resolve site by name or id
        let siteId: string | undefined = raw.siteId || undefined;
        const siteName = String(raw.siteName ?? '').trim();
        if (!siteId && siteName) {
          siteId = siteByName.get(siteName.toLowerCase());
          if (!siteId) {
            pushError(rowNo, `Unknown site "${siteName}"`);
            skipped++;
            continue;
          }
        }
        if (siteId) {
          const site = await this.prisma.site.findFirst({
            where: { id: siteId, organizationId },
            select: { id: true },
          });
          if (!site) {
            pushError(rowNo, `Site not found in your organization`);
            skipped++;
            continue;
          }
        }

        const status = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE'].includes(String(raw.status ?? '').toUpperCase())
          ? String(raw.status).toUpperCase()
          : 'ACTIVE';
        const shift = ['DAY', 'NIGHT', 'OFF'].includes(String(raw.currentShift ?? '').toUpperCase())
          ? String(raw.currentShift).toUpperCase()
          : 'DAY';
        const employmentDate = raw.employmentDate
          ? new Date(String(raw.employmentDate))
          : new Date();
        if (Number.isNaN(employmentDate.getTime())) {
          pushError(rowNo, `Invalid employment date "${raw.employmentDate}"`);
          skipped++;
          continue;
        }

        const data = {
          fullName,
          phone,
          address: String(raw.address ?? '').trim() || 'Not provided',
          emergencyContact: String(raw.emergencyContact ?? '').trim() || 'Not provided',
          nin,
          bvn: String(raw.bvn ?? '').trim() || undefined,
          guarantorDetails: String(raw.guarantorDetails ?? '').trim() || 'Not provided',
          employmentDate,
          status,
          currentShift: shift,
          assignedSiteId: siteId ?? null,
          trainingRecords: '[]',
          certificates: '[]',
          backgroundVerification: '{"status":"PENDING"}',
          disciplinaryHistory: '[]',
        };

        const existing = await this.prisma.guard.findFirst({
          where: { organizationId, OR: [{ nin }, { phone }] },
          select: { id: true },
        });

        let guardId: string;
        if (existing && mode === 'upsert') {
          await this.prisma.guard.update({ where: { id: existing.id }, data });
          guardId = existing.id;
          updated++;
        } else if (existing) {
          skipped++;
          continue;
        } else {
          const guard = await this.prisma.guard.create({
            data: { ...data, organizationId },
          });
          guardId = guard.id;
          created++;
        }

        // Optionally create a login account and link it to the guard
        if (createAccounts && email) {
          const used = await this.prisma.user.findUnique({ where: { email } });
          if (used) {
            pushError(rowNo, `Email ${email} already in use — account skipped`);
          } else {
            const password = String(raw.password ?? '').trim() || `Bastion@${nin.slice(-4)}`;
            const firstName = fullName.split(' ')[0] || 'Guard';
            const lastName = fullName.split(' ').slice(1).join(' ') || 'Personnel';
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await this.prisma.user.create({
              data: {
                organizationId,
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                role: 'GUARD',
              },
            });
            await this.prisma.guard.update({
              where: { id: guardId },
              data: { userId: user.id },
            });
            createdAccounts.push({ email, password });
          }
        }
      } catch (err) {
        pushError(rowNo, String((err as Error).message).slice(0, 160));
        skipped++;
      }
    }

    return {
      total: rows.length,
      created,
      updated,
      skipped,
      accountsCreated: createdAccounts.length,
      createdAccounts,
      errors,
      errorsTruncated: errors.length >= maxErrors,
    };
  }

  /** Parse a CSV upload into row objects, mapping headers to canonical names. */
  importFromCsv(text: string, organizationId: string) {
    const table = parseCsv(text);
    if (table.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row');
    }
    const headers = mapHeaders(table[0]);
    if (!headers.includes('fullName') || !headers.includes('nin') || !headers.includes('phone')) {
      throw new BadRequestException(
        'CSV must include "Full Name", "NIN" and "Phone" columns (see the template)',
      );
    }
    const rows = table.slice(1).map((cells) => {
      const row: Record<string, any> = {};
      cells.forEach((value, idx) => {
        const key = headers[idx];
        if (key) row[key] = value.trim();
      });
      return row;
    });
    return rows;
  }

  /** Build a downloadable CSV template with example rows. */
  buildCsvTemplate(): string {
    const header = [
      'Full Name',
      'NIN',
      'Phone',
      'Address',
      'Emergency Contact',
      'BVN',
      'Guarantor Details',
      'Employment Date',
      'Status',
      'Shift',
      'Site Name',
      'Email',
      'Password',
    ];
    const example = [
      'John Okafor',
      '12345678901',
      '08031234567',
      '12 Marina Road, Lagos',
      'Mary Okafor - 08039876543',
      '22334455667',
      'Brother - 08030000001',
      '2026-01-15',
      'ACTIVE',
      'NIGHT',
      'Banana Island Alpha Zone',
      'john.okafor@example.com',
      'Bastion@0001',
    ];
    const escape = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    return [header.map(escape).join(','), example.map(escape).join(',')].join('\r\n');
  }
}
