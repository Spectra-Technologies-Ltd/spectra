import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 40,
  HIGH: 25,
  MEDIUM: 12,
  LOW: 5,
};

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(n)));

/**
 * Napoleon — Spectra's intelligence layer. Deterministic, explainable signals
 * computed from live operational data (attendance, incidents, patrols, guard
 * performance). Each insight is rule-based so operators can trust and audit
 * it; the surface is designed so a learned model can slot in behind the same
 * endpoints later.
 */
@Injectable()
export class NapoleonService {
  private readonly logger = new Logger(NapoleonService.name);

  constructor(private prisma: PrismaService) {}

  private startOfWindow(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ── Public surface ────────────────────────────────────────────────────────

  async getOverview(organizationId: string) {
    const since30 = this.startOfWindow(30);
    const since14 = this.startOfWindow(14);

    const [sites, guards, incidents, attendance, patrols] = await Promise.all([
      this.prisma.site.findMany({
        where: { organizationId },
        select: { id: true, name: true, riskLevel: true },
      }),
      this.prisma.guard.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: { id: true, performanceScore: true },
      }),
      this.prisma.incident.findMany({
        where: { site: { organizationId }, reportedAt: { gte: since30 } },
        select: { severity: true, status: true, siteId: true, reportedAt: true },
      }),
      this.prisma.attendance.findMany({
        where: { guard: { organizationId }, createdAt: { gte: since14 } },
        select: { isLate: true, isAbsent: true, status: true },
      }),
      this.prisma.patrolRecord.findMany({
        where: { guard: { organizationId }, createdAt: { gte: since14 } },
        select: { completionPercentage: true },
      }),
    ]);

    const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;
    const avgPerformance =
      guards.length === 0
        ? 0
        : guards.reduce((s, g) => s + (g.performanceScore ?? 0), 0) / guards.length;
    const lateRate =
      attendance.length === 0
        ? 0
        : (attendance.filter((a) => a.isLate || a.status === 'FLAGGED').length /
            attendance.length) *
          100;
    const patrolCompletion =
      patrols.length === 0
        ? 0
        : patrols.reduce((s, p) => s + p.completionPercentage, 0) / patrols.length;

    const healthScore = clamp(
      avgPerformance * 0.4 +
        (100 - openIncidents * 3) * 0.25 +
        (100 - lateRate) * 0.2 +
        patrolCompletion * 0.15,
    );

    const insights = await this.buildInsights(organizationId, {
      sites,
      guards,
      incidents,
      attendance,
      patrols,
      lateRate,
      patrolCompletion,
      avgPerformance,
    });

    return {
      generatedAt: new Date().toISOString(),
      healthScore,
      openIncidents,
      avgGuardPerformance: Math.round(avgPerformance),
      lateCheckInRate: Math.round(lateRate * 10) / 10,
      patrolCompletionRate: Math.round(patrolCompletion * 10) / 10,
      atRiskGuardCount: guards.filter((g) => (g.performanceScore ?? 0) < 60).length,
      siteCount: sites.length,
      insights,
    };
  }

  async getRiskBySite(organizationId: string) {
    const sites = await this.prisma.site.findMany({
      where: { organizationId },
      select: { id: true, name: true, riskLevel: true },
    });

    const since = this.startOfWindow(30);
    const [incidents, attendance] = await Promise.all([
      this.prisma.incident.findMany({
        where: { site: { organizationId }, reportedAt: { gte: since } },
        select: { severity: true, siteId: true, reportedAt: true, status: true },
      }),
      this.prisma.attendance.findMany({
        where: { guard: { organizationId }, createdAt: { gte: since } },
        select: { siteId: true, isLate: true, isAbsent: true, status: true },
      }),
    ]);

    // Patrol completion by site (via route → site)
    const patrolRoutes = await this.prisma.patrolRoute.findMany({
      where: { site: { organizationId } },
      select: { id: true, siteId: true },
    });
    const routeToSite = new Map(patrolRoutes.map((r) => [r.id, r.siteId]));
    const patrolRecords = await this.prisma.patrolRecord.findMany({
      where: { guard: { organizationId }, createdAt: { gte: since } },
      select: { routeId: true, completionPercentage: true },
    });
    const patrolBySite = new Map<string, number[]>();
    for (const p of patrolRecords) {
      const siteId = routeToSite.get(p.routeId);
      if (!siteId) continue;
      if (!patrolBySite.has(siteId)) patrolBySite.set(siteId, []);
      patrolBySite.get(siteId)!.push(p.completionPercentage);
    }

    const bySite = new Map<string, { incidents: any[]; attendance: any[] }>();
    for (const s of sites) bySite.set(s.id, { incidents: [], attendance: [] });
    for (const i of incidents) bySite.get(i.siteId)?.incidents.push(i);
    for (const a of attendance) bySite.get(a.siteId)?.attendance.push(a);

    const result = sites.map((site) => {
      const { incidents: siteInc, attendance: siteAtt } = bySite.get(site.id) ?? {
        incidents: [],
        attendance: [],
      };
      const sitePatrols = patrolBySite.get(site.id) ?? [];
      const incidentScore = siteInc.reduce((s, i) => s + (SEVERITY_WEIGHT[i.severity] ?? 5), 0);
      const lateRate =
        siteAtt.length === 0
          ? 0
          : (siteAtt.filter((a) => a.isLate || a.status === 'FLAGGED').length / siteAtt.length) * 100;
      const patrolCompletion =
        sitePatrols.length === 0
          ? 100
          : sitePatrols.reduce((s, p) => s + p, 0) / sitePatrols.length;

      const riskScore = clamp(
        Math.min(incidentScore, 60) +
          lateRate * 0.25 +
          (100 - patrolCompletion) * 0.35 +
          (site.riskLevel === 'CRITICAL'
            ? 10
            : site.riskLevel === 'HIGH'
              ? 6
              : site.riskLevel === 'MEDIUM'
                ? 3
                : 0),
      );

      const hourBuckets = new Array(24).fill(0);
      for (const i of siteInc) hourBuckets[new Date(i.reportedAt).getHours()]++;
      const peakHour = hourBuckets.reduce((best, c, h) => (c > hourBuckets[best] ? h : best), 0);

      return {
        siteId: site.id,
        siteName: site.name,
        riskLevel: site.riskLevel,
        riskScore,
        incidentCount30d: siteInc.length,
        openIncidents30d: siteInc.filter((i) => i.status === 'OPEN').length,
        lateCheckInRate: Math.round(lateRate * 10) / 10,
        patrolCompletionRate: Math.round(patrolCompletion * 10) / 10,
        peakIncidentHour: hourBuckets[peakHour] > 0 ? peakHour : null,
      };
    });

    result.sort((a, b) => b.riskScore - a.riskScore);
    return result;
  }

  async getAtRiskGuards(organizationId: string) {
    const since = this.startOfWindow(14);
    const [guards, attendance] = await Promise.all([
      this.prisma.guard.findMany({
        where: { organizationId, status: 'ACTIVE' },
        select: {
          id: true,
          fullName: true,
          performanceScore: true,
          currentShift: true,
          assignedSite: { select: { name: true } },
        },
      }),
      this.prisma.attendance.findMany({
        where: { guard: { organizationId }, createdAt: { gte: since } },
        select: { guardId: true, isLate: true, isAbsent: true, status: true, createdAt: true },
      }),
    ]);

    const byGuard = new Map<
      string,
      { late: number; flagged: number; absent: number; days: Set<string> }
    >();
    for (const g of guards) byGuard.set(g.id, { late: 0, flagged: 0, absent: 0, days: new Set() });
    for (const a of attendance) {
      const row = byGuard.get(a.guardId);
      if (!row) continue;
      row.days.add(a.createdAt.toISOString().slice(0, 10));
      if (a.isAbsent || a.status === 'ABSENT') row.absent++;
      else if (a.isLate) row.late++;
      if (a.status === 'FLAGGED') row.flagged++;
    }

    return guards
      .map((g) => {
        const stats = byGuard.get(g.id) ?? { late: 0, flagged: 0, absent: 0, days: new Set() };
        const workedDays = stats.days.size;
        const reliability =
          workedDays === 0
            ? 100
            : Math.max(
                0,
                Math.round(
                  ((workedDays - stats.late - stats.absent) / Math.max(workedDays, 1)) * 100,
                ),
              );

        let riskLevel = 'LOW';
        const riskFactors: string[] = [];
        if (stats.late >= 3) {
          riskLevel = 'MEDIUM';
          riskFactors.push(`${stats.late} late check-ins in 14 days`);
        }
        if (stats.absent >= 2) {
          riskLevel = riskLevel === 'MEDIUM' ? 'HIGH' : 'MEDIUM';
          riskFactors.push(`${stats.absent} absent days in 14 days`);
        }
        if (stats.flagged >= 2) {
          riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
          riskFactors.push(`${stats.flagged} geofence violations`);
        }
        if ((g.performanceScore ?? 100) < 60) {
          riskLevel = 'HIGH';
          riskFactors.push(`performance score ${g.performanceScore}`);
        }

        return {
          guardId: g.id,
          fullName: g.fullName,
          shift: g.currentShift,
          site: g.assignedSite?.name ?? 'Unassigned',
          performanceScore: g.performanceScore ?? 100,
          reliability,
          lateCount: stats.late,
          absentCount: stats.absent,
          flaggedCount: stats.flagged,
          riskLevel,
          riskFactors,
        };
      })
      .filter((g) => g.riskLevel !== 'LOW')
      .sort((a, b) => b.riskFactors.length - a.riskFactors.length);
  }

  // ── Insight rules ─────────────────────────────────────────────────────────

  private async buildInsights(
    _organizationId: string,
    ctx: {
      sites: any[];
      guards: any[];
      incidents: any[];
      attendance: any[];
      patrols: any[];
      lateRate: number;
      patrolCompletion: number;
      avgPerformance: number;
    },
  ): Promise<any[]> {
    const insights: any[] = [];

    const open = ctx.incidents.filter((i) => i.status === 'OPEN').length;
    if (open >= 3) {
      insights.push({
        severity: 'HIGH',
        category: 'INCIDENTS',
        title: `${open} open incidents need attention`,
        detail: `Response has not closed ${open} incident(s) in the last 30 days. Unresolved incidents compound liability and client risk.`,
        recommendation: 'Assign owners to open incidents and escalate anything over 48 hours old.',
        metric: `${open} open`,
      });
    }

    if (ctx.lateRate > 20) {
      insights.push({
        severity: 'MEDIUM',
        category: 'ATTENDANCE',
        title: `Late check-ins running at ${Math.round(ctx.lateRate)}%`,
        detail: 'More than 1 in 5 check-ins over the last 14 days was late or flagged outside the geofence.',
        recommendation: 'Review shift start times and consider SMS reminders 30 minutes before shift.',
        metric: `${Math.round(ctx.lateRate)}%`,
      });
    }

    if (ctx.patrolCompletion < 80) {
      insights.push({
        severity: 'MEDIUM',
        category: 'PATROLS',
        title: `Patrol completion at ${Math.round(ctx.patrolCompletion)}%`,
        detail: 'Patrol routes are being completed below the 80% target, leaving coverage gaps.',
        recommendation: 'Reassign under-completed routes to guards on overlapping shifts.',
        metric: `${Math.round(ctx.patrolCompletion)}%`,
      });
    }

    const nightIncidents = ctx.incidents.filter((i) => {
      const h = new Date(i.reportedAt).getHours();
      return h >= 18 || h < 6;
    }).length;
    if (nightIncidents > 0 && nightIncidents / Math.max(ctx.incidents.length, 1) > 0.5) {
      insights.push({
        severity: 'MEDIUM',
        category: 'PATTERNS',
        title: `Most incidents occur at night (${Math.round((nightIncidents / ctx.incidents.length) * 100)}%)`,
        detail: 'Night hours carry the majority of incident load — a sign coverage thins when visibility drops.',
        recommendation: 'Add a dedicated night supervisor and increase patrol frequency after 20:00.',
        metric: `${nightIncidents}/${ctx.incidents.length}`,
      });
    }

    const lowPerformers = ctx.guards.filter((g) => (g.performanceScore ?? 0) < 60).length;
    if (lowPerformers > 0) {
      insights.push({
        severity: lowPerformers > 3 ? 'HIGH' : 'MEDIUM',
        category: 'PERSONNEL',
        title: `${lowPerformers} guard(s) scoring below 60`,
        detail: 'Performance scores indicate attendance and reliability problems that can become attrition risk.',
        recommendation: 'Schedule check-ins with the at-risk guards and review their site assignments.',
        metric: `${lowPerformers} guards`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        severity: 'INFO',
        category: 'HEALTH',
        title: 'Operations are stable',
        detail: 'No anomalies detected across attendance, incidents, or patrols in the review window.',
        recommendation: 'Continue monitoring — Napoleon will alert you the moment a pattern shifts.',
        metric: 'All clear',
      });
    }

    return insights;
  }
}
