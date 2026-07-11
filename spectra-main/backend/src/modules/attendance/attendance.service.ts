import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CheckInDto, CheckOutDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

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
    const today = new Date();
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

    // 3. Geofence Check (e.g., must be within 200 meters of the site)
    const distance = this.getDistance(site.latitude, site.longitude, dto.latitude, dto.longitude);
    const isWithinGeofence = distance <= 200; // 200m radius

    // 4. Create attendance record
    return this.prisma.attendance.create({
      data: {
        guardId: guard.id,
        siteId: site.id,
        checkInTime: new Date(),
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
        checkInLocation: JSON.stringify({ lat: dto.latitude, lng: dto.longitude }),
        checkInMethod: 'GPS',
        status: isWithinGeofence ? 'ON_TIME' : 'FLAGGED',
        photoUrl: dto.photoUrl ?? '',
        verifiedStatus: isWithinGeofence,
      },
    });
  }

  async checkOut(dto: CheckOutDto, user: { id: string; role: string; organizationId: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { guard } = await this.resolveGuardAndSite(dto, user);

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

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: new Date(),
        checkOutLocation: JSON.stringify({ lat: dto.latitude, lng: dto.longitude }),
      },
    });
  }

  async getAttendanceHistory(query: { page?: number; limit?: number; siteId?: string; date?: string; organizationId: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { guard: { organizationId: query.organizationId } };
    if (query.siteId) where.siteId = query.siteId;
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
}
