import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
    ] = await Promise.all([
      this.prisma.guard.count(),
      this.prisma.guard.count({ where: { status: 'ACTIVE' } }),
      this.prisma.guard.count({ where: { status: 'ON_LEAVE' } }),
      this.prisma.guard.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.site.count(),
      this.prisma.site.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
      this.prisma.client.count(),
      this.prisma.incident.count({ where: { investigationStatus: { in: ['OPEN', 'UNDER_INVESTIGATION'] } } }),
      this.prisma.attendance.count({ where: { checkInTime: { gte: today } } }),
      this.prisma.attendance.count({ where: { checkInTime: { gte: today }, isLate: true } }),
      this.prisma.attendance.count({ where: { isAbsent: true } }),
    ]);

    const attendanceRate = activeGuards > 0
      ? Math.round(((activeGuards - todayAbsent) / activeGuards) * 1000) / 10
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
      attendanceRate,
    };
  }

  async getIncidentsByType() {
    const incidents = await this.prisma.incident.groupBy({
      by: ['incidentType'],
      _count: { id: true },
    });
    return incidents.map((i) => ({ type: i.incidentType, count: i._count.id }));
  }

  async getSiteRiskDistribution() {
    const sites = await this.prisma.site.groupBy({
      by: ['riskLevel'],
      _count: { id: true },
    });
    return sites.map((s) => ({ riskLevel: s.riskLevel, count: s._count.id }));
  }

  async getAttendanceTrend() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const total = await this.prisma.attendance.count({
        where: { checkInTime: { gte: date, lt: nextDate } },
      });
      const late = await this.prisma.attendance.count({
        where: { checkInTime: { gte: date, lt: nextDate }, isLate: true },
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push({
        day: dayNames[date.getDay()],
        rate: total > 0 ? Math.round(((total - late) / total) * 100) : 100,
      });
    }
    return days;
  }

  async getRecentActivities() {
    const [recentIncidents, recentAttendance] = await Promise.all([
      this.prisma.incident.findMany({
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
        take: 5,
        orderBy: { checkInTime: 'desc' },
        select: {
          guard: { select: { fullName: true } },
          site: { select: { name: true } },
          checkInTime: true,
          isLate: true,
        },
      }),
    ]);

    const activities: { type: string; text: string; time: Date }[] = [];

    for (const inc of recentIncidents) {
      activities.push({
        type: 'incident',
        text: `Incident reported: ${inc.incidentType} at ${inc.site.name}`,
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

    activities.sort((a, b) => b.time.getTime() - a.time.getTime());
    return activities.slice(0, 10);
  }
}
