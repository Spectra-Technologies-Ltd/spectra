import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalGuards,
      activeGuards,
      onLeaveGuards,
      suspendedGuards,
      totalSites,
      highRiskSites,
      totalClients,
      openIncidents,
      todayAttendance,
      todayLate,
      todayAbsent,
      todayFlagged,
      totalPatrols,
      completedPatrols,
      inProgressPatrols,
    ] = await Promise.all([
      this.prisma.guard.count({ where: { organizationId } }),
      this.prisma.guard.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.guard.count({
        where: { organizationId, status: 'ON_LEAVE' },
      }),
      this.prisma.guard.count({
        where: { organizationId, status: 'SUSPENDED' },
      }),
      this.prisma.site.count({ where: { organizationId } }),
      this.prisma.site.count({
        where: { organizationId, riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      }),
      this.prisma.client.count({ where: { organizationId } }),
      this.prisma.incident.count({
        where: {
          site: { organizationId },
          investigationStatus: { in: ['OPEN', 'UNDER_INVESTIGATION'] },
        },
      }),
      this.prisma.attendance.count({
        where: {
          guard: { organizationId },
          checkInTime: { gte: today, lt: tomorrow },
          status: { not: 'ABSENT' },
        },
      }),
      this.prisma.attendance.count({
        where: {
          guard: { organizationId },
          checkInTime: { gte: today, lt: tomorrow },
          isLate: true,
        },
      }),
      this.prisma.attendance.count({
        where: {
          guard: { organizationId },
          checkInTime: { gte: today, lt: tomorrow },
          status: 'ABSENT',
        },
      }),
      this.prisma.attendance.count({
        where: {
          guard: { organizationId },
          checkInTime: { gte: today, lt: tomorrow },
          status: 'FLAGGED',
        },
      }),
      this.prisma.patrolRecord.count({
        where: { route: { site: { organizationId } } },
      }),
      this.prisma.patrolRecord.count({
        where: { route: { site: { organizationId } }, status: 'COMPLETED' },
      }),
      this.prisma.patrolRecord.count({
        where: { route: { site: { organizationId } }, status: 'IN_PROGRESS' },
      }),
    ]);

    // Attendance rate: (non-absent active guards) / total active guards
    const attendanceRate =
      activeGuards > 0
        ? Math.round(
            ((activeGuards - todayAbsent) / activeGuards) * 1000,
          ) / 10
        : 100;

    return {
      totalGuards,
      activeGuards,
      onLeaveGuards,
      suspendedGuards,
      totalSites,
      highRiskSites,
      totalClients,
      openIncidents,
      todayAttendance,
      todayLate,
      todayAbsent,
      todayFlagged,
      attendanceRate,
      totalPatrols,
      completedPatrols,
      inProgressPatrols,
    };
  }

  async getIncidentsByType(organizationId: string) {
    const incidents = await this.prisma.incident.groupBy({
      by: ['incidentType'],
      where: { site: { organizationId } },
      _count: { id: true },
    });
    return incidents.map((i) => ({ type: i.incidentType, count: i._count.id }));
  }

  async getSiteRiskDistribution(organizationId: string) {
    const sites = await this.prisma.site.groupBy({
      by: ['riskLevel'],
      where: { organizationId },
      _count: { id: true },
    });
    return sites.map((s) => ({ riskLevel: s.riskLevel, count: s._count.id }));
  }

  async getPatrolStats(organizationId: string) {
    const total = await this.prisma.patrolRecord.count({
      where: { route: { site: { organizationId } } },
    });
    const completed = await this.prisma.patrolRecord.count({
      where: { route: { site: { organizationId } }, status: 'COMPLETED' },
    });
    return {
      total,
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 100,
    };
  }

  async getAttendanceTrend(organizationId: string) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const total = await this.prisma.attendance.count({
        where: {
          guard: { organizationId },
          checkInTime: { gte: date, lt: nextDate },
        },
      });
      const late = await this.prisma.attendance.count({
        where: {
          guard: { organizationId },
          checkInTime: { gte: date, lt: nextDate },
          isLate: true,
        },
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push({
        day: dayNames[date.getDay()],
        rate: total > 0 ? Math.round(((total - late) / total) * 100) : 100,
      });
    }
    return days;
  }

  async getRecentActivities(organizationId: string) {
    const [recentIncidents, recentAttendance, recentPatrols] = await Promise.all([
      this.prisma.incident.findMany({
        where: { site: { organizationId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          incidentType: true,
          severity: true,
          site: { select: { name: true } },
          createdAt: true,
        },
      }),
      this.prisma.attendance.findMany({
        where: { guard: { organizationId } },
        take: 5,
        orderBy: { checkInTime: 'desc' },
        select: {
          guard: { select: { fullName: true } },
          site: { select: { name: true } },
          checkInTime: true,
          isLate: true,
        },
      }),
      this.prisma.patrolRecord.findMany({
        where: { route: { site: { organizationId } } },
        take: 5,
        orderBy: { startTime: 'desc' },
        select: {
          guard: { select: { fullName: true } },
          route: { select: { name: true, site: { select: { name: true } } } },
          status: true,
          startTime: true,
          completionPercentage: true,
        },
      }),
    ]);

    const activities: { type: string; text: string; time: Date }[] = [];

    for (const inc of recentIncidents) {
      activities.push({
        type: 'incident',
        text: `Incident reported: ${inc.incidentType} at ${inc.site?.name || 'unknown site'}`,
        time: inc.createdAt,
      });
    }
    for (const att of recentAttendance) {
      activities.push({
        type: att.isLate ? 'late' : 'attendance',
        text: `Guard ${att.guard.fullName} checked in at ${att.site.name}`,
        time: att.checkInTime,
      });
    }
    for (const patrol of recentPatrols) {
      activities.push({
        type: patrol.status === 'COMPLETED' ? 'patrol_completed' : 'patrol_started',
        text: `Guard ${patrol.guard.fullName} ${patrol.status === 'COMPLETED' ? 'completed' : 'started'} patrol "${patrol.route.name}" at ${patrol.route.site.name} (${patrol.completionPercentage}%)`,
        time: patrol.startTime,
      });
    }

    activities.sort((a, b) => b.time.getTime() - a.time.getTime());
    return activities.slice(0, 10);
  }

  async getGuardStats(organizationId: string) {
    const guards = await this.prisma.guard.findMany({
      where: { organizationId },
      select: {
        id: true,
        fullName: true,
        status: true,
        currentShift: true,
        performanceScore: true,
        assignedSite: { select: { name: true } },
        _count: {
          select: {
            attendances: true,
            patrolRecords: true,
          },
        },
      },
    });

    return guards.map(g => ({
      id: g.id,
      name: g.fullName,
      status: g.status,
      shift: g.currentShift,
      performanceScore: g.performanceScore,
      site: g.assignedSite?.name || 'Unassigned',
      totalAttendances: g._count.attendances,
      totalPatrols: g._count.patrolRecords,
    }));
  }

  async getSiteComparison(organizationId: string) {
    const sites = await this.prisma.site.findMany({
      where: { organizationId },
      include: {
        _count: { select: { guards: true, incidents: true, attendances: true } },
        client: { select: { companyName: true } },
      },
    });

    return sites.map(s => ({
      id: s.id,
      name: s.name,
      client: s.client.companyName,
      riskLevel: s.riskLevel,
      targetGuards: s.targetGuards,
      assignedGuards: s._count.guards,
      totalIncidents: s._count.incidents,
      totalAttendances: s._count.attendances,
      guardFillRate: s.targetGuards > 0 ? Math.round((s._count.guards / s.targetGuards) * 100) : 0,
    }));
  }

  /**
   * Everything the live map needs in one request: sites with coordinates,
   * on-duty guards with their latest known position (from their most recent
   * GPS check-in), and recent incidents with severity + location.
   */
  async getMapData(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sites, activeGuards, recentIncidents] = await Promise.all([
      this.prisma.site.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          riskLevel: true,
          targetGuards: true,
          client: { select: { companyName: true } },
          _count: { select: { guards: true, incidents: true } },
          incidents: {
            where: { investigationStatus: { in: ['OPEN', 'UNDER_INVESTIGATION'] } },
            select: { id: true },
          },
        },
      }),
      // ACTIVE guards with their latest attendance (for last-known position)
      this.prisma.guard.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: {
          id: true,
          fullName: true,
          currentShift: true,
          assignedSiteId: true,
          assignedSite: { select: { id: true, name: true, latitude: true, longitude: true } },
          attendances: {
            orderBy: { checkInTime: 'desc' },
            take: 1,
            select: {
              checkInTime: true,
              checkInLatitude: true,
              checkInLongitude: true,
              checkOutTime: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.incident.findMany({
        // Active incidents always show; closed ones drop off after 14 days
        where: {
          site: { organizationId },
          OR: [
            { investigationStatus: { in: ['OPEN', 'UNDER_INVESTIGATION'] } },
            { reportedAt: { gte: this.startOfDaysAgo(14) } },
          ],
        },
        orderBy: { reportedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          reportedAt: true,
          siteId: true,
          site: { select: { name: true, latitude: true, longitude: true } },
        },
      }),
    ]);

    const siteMap = new Map(sites.map((s) => [s.id, s]));

    const guards = activeGuards.map((g) => {
      const latest = g.attendances[0];
      const onDuty = latest && !latest.checkOutTime;
      const hasGps =
        typeof latest?.checkInLatitude === 'number' &&
        typeof latest?.checkInLongitude === 'number' &&
        latest.checkInLatitude !== 0 &&
        latest.checkInLongitude !== 0;
      const site = g.assignedSite;

      return {
        id: g.id,
        fullName: g.fullName,
        shift: g.currentShift,
        onDuty,
        status: latest?.status ?? null,
        lastSeen: latest?.checkInTime?.toISOString() ?? null,
        // Prefer real GPS from the last check-in; fall back to the site location
        latitude: hasGps ? latest!.checkInLatitude : (site?.latitude ?? null),
        longitude: hasGps ? latest!.checkInLongitude : (site?.longitude ?? null),
        siteId: site?.id ?? g.assignedSiteId ?? null,
        siteName: site?.name ?? null,
      };
    });

    const incidents = recentIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      reportedAt: i.reportedAt.toISOString(),
      siteId: i.siteId,
      siteName: i.site?.name ?? null,
      latitude: i.site?.latitude ?? null,
      longitude: i.site?.longitude ?? null,
    }));

    const siteList = sites.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      riskLevel: s.riskLevel,
      clientName: s.client?.companyName ?? null,
      guardsAssigned: s._count.guards,
      guardsOnDuty: guards.filter((g) => g.siteId === s.id && g.onDuty).length,
      totalIncidents: s._count.incidents,
      openIncidents: s.incidents.length,
      targetGuards: s.targetGuards,
    }));

    return {
      generatedAt: new Date().toISOString(),
      bounds: this.computeBounds(siteList),
      sites: siteList,
      guards,
      incidents,
    };
  }

  private startOfDaysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private computeBounds(sites: { latitude: number; longitude: number }[]) {
    const withCoords = sites.filter(
      (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number',
    );
    if (withCoords.length === 0) return null;
    const lats = withCoords.map((s) => s.latitude);
    const lngs = withCoords.map((s) => s.longitude);
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }
}
