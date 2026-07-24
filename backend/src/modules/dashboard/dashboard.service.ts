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
}
