import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CheckInDto, CheckOutDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  // Distance calculation using Haversine formula
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }

  private async resolveGuardAndSite(
    dto: { guardId?: string; siteId?: string },
    user: { id: string; role: string; organizationId: string },
  ) {
    const guardId = dto.guardId ?? (await this.prisma.guard.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }))?.id;
    if (!guardId) throw new NotFoundException('Guard profile not found for this employee');

    const guard = await this.prisma.guard.findFirst({
      where: { id: guardId, organizationId: user.organizationId },
    });
    if (!guard) throw new NotFoundException('Guard not found');

    const siteId = dto.siteId ?? guard.assignedSiteId;
    if (!siteId) throw new BadRequestException('Guard is not assigned to a site');

    const site = await this.prisma.site.findFirst({
      where: { id: siteId, organizationId: user.organizationId },
    });
    if (!site) throw new NotFoundException('Site not found');

    if (guard.assignedSiteId && guard.assignedSiteId !== site.id) {
      throw new ForbiddenException('Guard is not assigned to this site');
    }

    return { guard, site };
  }

  async checkIn(dto: CheckInDto, user: { id: string; role: string; organizationId: string }) {
    // 1. Verify site and guard exist
    const { guard, site } = await this.resolveGuardAndSite(dto, user);

    // 2. Check if guard is already checked in today without checking out
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const existingRecord = await this.prisma.attendance.findFirst({
      where: {
        guardId: guard.id,
        createdAt: { gte: today },
        checkOutTime: null,
      },
    });

    if (existingRecord) {
      throw new BadRequestException('Guard is already checked in.');
    }

    // 3. Shift-aware validation: determine expected check-in window
    let isLate = false;
    if (guard.currentShift === 'DAY') {
      // Day shift expected check-in: 05:00 - 08:00
      const hour = now.getHours();
      if (hour > 8) isLate = true;
    } else if (guard.currentShift === 'NIGHT') {
      // Night shift expected check-in: 17:00 - 20:00
      const hour = now.getHours();
      if (hour > 20 || hour < 5) isLate = true;
    }

    // 4. Geofence Check (must be within 200 meters of the site)
    const distance = this.getDistance(site.latitude, site.longitude, dto.latitude, dto.longitude);
    const isWithinGeofence = distance <= 200; // 200m radius

    // 5. Determine status
    let status = 'ON_TIME';
    if (!isWithinGeofence) {
      status = 'FLAGGED';
    } else if (isLate) {
      status = 'LATE';
    }

    // 6. Create attendance record
    const record = await this.prisma.attendance.create({
      data: {
        guardId: guard.id,
        siteId: site.id,
        checkInTime: now,
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
        checkInLocation: JSON.stringify({ lat: dto.latitude, lng: dto.longitude }),
        checkInMethod: 'GPS',
        status,
        photoUrl: dto.photoUrl ?? '',
        verifiedStatus: isWithinGeofence,
        isLate,
      },
    });

    // 7. Update guard performance score based on attendance rate
    await this.updateGuardPerformanceScore(guard.id);

    // Real-time check-in event for the command center
    this.realtime.publish(user.organizationId, 'attendance:checkin', {
      id: record.id,
      guardId: guard.id,
      guardName: guard.fullName,
      siteId: site.id,
      siteName: site.name,
      status,
      isLate,
      withinGeofence: isWithinGeofence,
      time: record.checkInTime.toISOString(),
    });

    // 8. Write audit log (fire-and-forget)
    this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATTENDANCE_CHECK_IN',
        entity: 'Attendance',
        entityId: record.id,
        newValues: JSON.stringify({
          guardId: guard.id,
          siteId: site.id,
          status,
          isLate,
          withinGeofence: isWithinGeofence,
        }),
        ipAddress: '',
        userAgent: '',
      },
    }).catch(() => {});

    return record;
  }

  async checkOut(dto: CheckOutDto, user: { id: string; role: string; organizationId: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { guard, site } = await this.resolveGuardAndSite(dto, user);

    const record = await this.prisma.attendance.findFirst({
      where: {
        guardId: guard.id,
        createdAt: { gte: today },
        checkOutTime: null,
      },
    });

    if (!record) {
      throw new BadRequestException('No active check-in found for today.');
    }

    // Geofence check on checkout too (must be within 200m)
    const distance = this.getDistance(site.latitude, site.longitude, dto.latitude, dto.longitude);
    const isWithinGeofence = distance <= 200;

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: new Date(),
        checkOutLatitude: dto.latitude,
        checkOutLongitude: dto.longitude,
        checkOutLocation: JSON.stringify({ lat: dto.latitude, lng: dto.longitude }),
        checkOutMethod: isWithinGeofence ? 'GPS' : 'SUPERVISOR_APPROVAL',
        verifiedStatus: record.verifiedStatus && isWithinGeofence,
      },
    });
  }

  /**
   * Recalculate and update a guard's performance score based on attendance records.
   * Scoring: 70% attendance rate, with penalties for absences and late arrivals.
   */
  private async updateGuardPerformanceScore(guardId: string): Promise<void> {
    const totalRecords = await this.prisma.attendance.count({
      where: { guardId },
    });
    if (totalRecords === 0) return;

    const lateCount = await this.prisma.attendance.count({
      where: { guardId, isLate: true },
    });
    const flaggedCount = await this.prisma.attendance.count({
      where: { guardId, status: 'FLAGGED' },
    });

    // Rate: (on-time / total) * 100, then penalize for flagged check-ins
    const onTimeCount = totalRecords - lateCount;
    const baseRate = (onTimeCount / totalRecords) * 100;
    const penalty = flaggedCount * 2; // -2 points per geofence violation
    const finalScore = Math.max(0, Math.min(100, Math.round(baseRate - penalty)));

    await this.prisma.guard.update({
      where: { id: guardId },
      data: { performanceScore: finalScore },
    });
  }

  /**
   * Detect and mark guards as absent for a given date.
   * A guard is absent if they have no check-in record for the date and are ACTIVE.
   */
  async markAbsentGuards(organizationId: string, date?: string): Promise<number> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all active guards who have no attendance record for this day
    const activeGuards = await this.prisma.guard.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: { id: true },
    });

    let absentCount = 0;
    for (const guard of activeGuards) {
      const hasAttendance = await this.prisma.attendance.findFirst({
        where: {
          guardId: guard.id,
          checkInTime: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (!hasAttendance) {
        // Fetch full guard data to get assigned site
        const fullGuard = await this.prisma.guard.findUnique({
          where: { id: guard.id },
          select: { assignedSiteId: true },
        });
        // Create an absent record
        await this.prisma.attendance.create({
          data: {
            guardId: guard.id,
            siteId: fullGuard?.assignedSiteId || '',
            checkInTime: startOfDay,
            checkInLatitude: 0,
            checkInLongitude: 0,
            checkInMethod: 'GPS',
            status: 'ABSENT',
            isAbsent: true,
          },
        });
        absentCount++;
      }
    }

    return absentCount;
  }

  async getAttendanceHistory(query: { page?: number; limit?: number; siteId?: string; date?: string; guardId?: string; organizationId: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { guard: { organizationId: query.organizationId } };
    if (query.siteId) where.siteId = query.siteId;
    if (query.guardId) where.guardId = query.guardId;
    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          guard: { select: { id: true, fullName: true, currentShift: true } },
          site: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  /** Export attendance records as CSV for payroll / compliance. */
  async exportCsv(opts: { organizationId: string; date?: string; siteId?: string }) {
    const where: any = { guard: { organizationId: opts.organizationId } };
    if (opts.siteId) where.siteId = opts.siteId;
    if (opts.date) {
      const startOfDay = new Date(opts.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(opts.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        guard: { select: { fullName: true, nin: true, currentShift: true } },
        site: { select: { name: true } },
      },
    });

    const header = [
      'Date',
      'Guard Name',
      'NIN',
      'Site',
      'Check In',
      'Check Out',
      'Status',
      'Late',
      'Shift',
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = records.map((r) =>
      [
        r.createdAt.toLocaleDateString('en-GB'),
        r.guard.fullName,
        r.guard.nin,
        r.site.name,
        r.checkInTime?.toLocaleString('en-GB'),
        r.checkOutTime?.toLocaleString('en-GB') ?? '',
        r.status,
        r.isLate ? 'YES' : 'NO',
        r.guard.currentShift,
      ]
        .map(escape)
        .join(','),
    );

    return [header.join(','), ...rows].join('\r\n');
  }
}
