import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type BaselineMetric = 'LATE_COUNT' | 'INCIDENT_COUNT' | 'PATROL_DURATION_MS';

export const BASELINE_METRICS: readonly BaselineMetric[] = [
  'LATE_COUNT',
  'INCIDENT_COUNT',
  'PATROL_DURATION_MS',
];

export const DEFAULT_ACTUAL_DAYS = 7;
export const DEFAULT_BASELINE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Flag a deviation when it is this many standard deviations from the baseline. */
const Z_FLAG = 2;
/** ...or when it is this far (percent) from what the baseline predicts. */
const PCT_FLAG = 50;

export function isBaselineMetric(value: string): value is BaselineMetric {
  return (BASELINE_METRICS as readonly string[]).includes(value);
}

export type BaselineVerdict = {
  metric: BaselineMetric;
  unit: 'count' | 'ms';
  /** How `actual` is aggregated: counts are summed, durations are averaged. */
  aggregation: 'sum' | 'mean';
  /** Per-day mean across the baseline window (null when the window has no data). */
  baseline: number | null;
  /** Standard deviation of the per-day baseline values. */
  dailyStdDev: number | null;
  /** What the baseline predicts for the actual window. */
  expected: number | null;
  /** Observed value in the actual window. */
  actual: number;
  deviation: number | null;
  deviationPct: number | null;
  zScore: number | null;
  direction: 'UP' | 'DOWN' | 'FLAT';
  flagged: boolean;
  /** Baseline days that contained an observation. */
  sampleDays: number;
};

export type SurpriseVerdict = {
  siteId: string;
  siteName: string;
  metric: BaselineMetric;
  value: number;
  days: number;
  baseline: number | null;
  dailyStdDev: number | null;
  observedPerDay: number;
  deviationPct: number | null;
  zScore: number | null;
  surprised: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  thresholds: { zScore: number; deviationPct: number };
  explanation: string;
};

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

const stddev = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
};

/**
 * Baselines — the reference behaviour of a site, and how far current reality
 * drifts from it. Metrics are derived from the same operational data Napoleon
 * uses, so an insight and its baseline always agree.
 */
@Injectable()
export class BaselinesService {
  constructor(private prisma: PrismaService) {}

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private dayKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  /** Ordered list of the last `days` day keys, oldest first. */
  private dayKeys(days: number, now = Date.now()): string[] {
    const keys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      keys.push(this.dayKey(new Date(now - i * DAY_MS)));
    }
    return keys;
  }

  private async assertSite(organizationId: string, siteId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, organizationId },
      select: { id: true, name: true, riskLevel: true },
    });
    if (!site) throw new NotFoundException(`Site ${siteId} not found`);
    return site;
  }

  /** Attendance counts as late in the same way Napoleon's late-rate does. */
  private isLateRow(a: { isLate: boolean; status: string }): boolean {
    return a.isLate || a.status === 'FLAGGED';
  }

  // ── Public surface ────────────────────────────────────────────────────────

  /**
   * Baseline vs actual for every tracked metric at a site. The baseline window
   * sits *before* the actual window so the two never overlap.
   */
  async getSiteBaselines(
    organizationId: string,
    siteId: string,
    actualDays = DEFAULT_ACTUAL_DAYS,
    baselineDays = DEFAULT_BASELINE_DAYS,
  ) {
    const site = await this.assertSite(organizationId, siteId);
    const now = Date.now();
    const spanStart = this.startOfDay(new Date(now - (actualDays + baselineDays) * DAY_MS));

    const [attendance, incidents, patrols] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { siteId, checkInTime: { gte: spanStart } },
        select: { checkInTime: true, isLate: true, status: true },
      }),
      this.prisma.incident.findMany({
        where: { siteId, reportedAt: { gte: spanStart } },
        select: { reportedAt: true },
      }),
      this.prisma.patrolRecord.findMany({
        where: { route: { siteId }, startTime: { gte: spanStart } },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const allDays = this.dayKeys(actualDays + baselineDays, now);
    const baselineDayKeys = allDays.slice(0, baselineDays);
    const actualDayKeys = allDays.slice(baselineDays);

    const lateByDay = new Map<string, number>();
    for (const a of attendance) {
      if (!this.isLateRow(a)) continue;
      const k = this.dayKey(a.checkInTime);
      lateByDay.set(k, (lateByDay.get(k) ?? 0) + 1);
    }

    const incidentsByDay = new Map<string, number>();
    for (const i of incidents) {
      const k = this.dayKey(i.reportedAt);
      incidentsByDay.set(k, (incidentsByDay.get(k) ?? 0) + 1);
    }

    const durationByDay = new Map<string, { total: number; n: number }>();
    for (const p of patrols) {
      if (!p.endTime) continue;
      const ms = p.endTime.getTime() - p.startTime.getTime();
      if (ms <= 0) continue;
      const k = this.dayKey(p.startTime);
      const cur = durationByDay.get(k) ?? { total: 0, n: 0 };
      durationByDay.set(k, { total: cur.total + ms, n: cur.n + 1 });
    }

    const countVerdict = (metric: BaselineMetric, byDay: Map<string, number>): BaselineVerdict => {
      const baselineValues = baselineDayKeys.map((k) => byDay.get(k) ?? 0);
      const actual = actualDayKeys.reduce((sum, k) => sum + (byDay.get(k) ?? 0), 0);
      return this.verdict(metric, 'count', 'sum', baselineValues, actual, actualDays);
    };

    // Durations average across the days that actually have patrols.
    const durationBaselineValues = baselineDayKeys
      .map((k) => durationByDay.get(k))
      .filter((v): v is { total: number; n: number } => !!v)
      .map((v) => v.total / v.n);
    let durationTotal = 0;
    let durationCount = 0;
    for (const k of actualDayKeys) {
      const v = durationByDay.get(k);
      if (!v) continue;
      durationTotal += v.total;
      durationCount += v.n;
    }
    const durationActual = durationCount > 0 ? durationTotal / durationCount : 0;

    const metrics: Record<BaselineMetric, BaselineVerdict> = {
      LATE_COUNT: countVerdict('LATE_COUNT', lateByDay),
      INCIDENT_COUNT: countVerdict('INCIDENT_COUNT', incidentsByDay),
      PATROL_DURATION_MS: this.verdict(
        'PATROL_DURATION_MS',
        'ms',
        'mean',
        durationBaselineValues,
        durationActual,
        actualDays,
      ),
    };

    return {
      siteId: site.id,
      siteName: site.name,
      riskLevel: site.riskLevel,
      generatedAt: new Date().toISOString(),
      windows: { actualDays, baselineDays },
      metrics,
      flaggedMetrics: BASELINE_METRICS.filter((m) => metrics[m].flagged),
    };
  }

  /**
   * Score a single observation against a site's baseline for one metric.
   * This is the "surprise" signal: how unexpected is this value?
   */
  async evaluateObservation(
    organizationId: string,
    siteId: string,
    metric: BaselineMetric,
    value: number,
    days = DEFAULT_BASELINE_DAYS,
  ): Promise<SurpriseVerdict> {
    const site = await this.assertSite(organizationId, siteId);
    const now = Date.now();
    const spanStart = this.startOfDay(new Date(now - days * DAY_MS));
    const dayKeys = this.dayKeys(days, now);

    let baselineValues: number[] = [];

    if (metric === 'LATE_COUNT') {
      const rows = await this.prisma.attendance.findMany({
        where: { siteId, checkInTime: { gte: spanStart } },
        select: { checkInTime: true, isLate: true, status: true },
      });
      const byDay = new Map<string, number>();
      for (const a of rows) {
        if (!this.isLateRow(a)) continue;
        const k = this.dayKey(a.checkInTime);
        byDay.set(k, (byDay.get(k) ?? 0) + 1);
      }
      baselineValues = dayKeys.map((k) => byDay.get(k) ?? 0);
    } else if (metric === 'INCIDENT_COUNT') {
      const rows = await this.prisma.incident.findMany({
        where: { siteId, reportedAt: { gte: spanStart } },
        select: { reportedAt: true },
      });
      const byDay = new Map<string, number>();
      for (const i of rows) {
        const k = this.dayKey(i.reportedAt);
        byDay.set(k, (byDay.get(k) ?? 0) + 1);
      }
      baselineValues = dayKeys.map((k) => byDay.get(k) ?? 0);
    } else {
      const rows = await this.prisma.patrolRecord.findMany({
        where: { route: { siteId }, startTime: { gte: spanStart } },
        select: { startTime: true, endTime: true },
      });
      const byDay = new Map<string, { total: number; n: number }>();
      for (const p of rows) {
        if (!p.endTime) continue;
        const ms = p.endTime.getTime() - p.startTime.getTime();
        if (ms <= 0) continue;
        const k = this.dayKey(p.startTime);
        const cur = byDay.get(k) ?? { total: 0, n: 0 };
        byDay.set(k, { total: cur.total + ms, n: cur.n + 1 });
      }
      baselineValues = dayKeys
        .map((k) => byDay.get(k))
        .filter((v): v is { total: number; n: number } => !!v)
        .map((v) => v.total / v.n);
    }

    const baseline = baselineValues.length > 0 ? mean(baselineValues) : null;
    const sd = baselineValues.length > 1 ? stddev(baselineValues) : null;
    const observedPerDay = metric === 'PATROL_DURATION_MS' ? value : value / days;

    const deviationPct =
      baseline === null || baseline === 0
        ? value > 0
          ? 100
          : 0
        : ((observedPerDay - baseline) / baseline) * 100;
    const zScore = baseline !== null && sd ? (observedPerDay - baseline) / sd : null;

    const severity: SurpriseVerdict['severity'] =
      (zScore !== null && Math.abs(zScore) >= Z_FLAG * 1.5) || Math.abs(deviationPct) >= 100
        ? 'HIGH'
        : (zScore !== null && Math.abs(zScore) >= Z_FLAG) || Math.abs(deviationPct) >= PCT_FLAG
          ? 'MEDIUM'
          : 'LOW';

    const unitLabel = metric === 'PATROL_DURATION_MS' ? 'ms' : 'per day';
    const explanation =
      baseline === null
        ? `No baseline for ${metric} at ${site.name} over the last ${days} days — this is the first observation.`
        : `${metric} at ${site.name} is ${Math.abs(deviationPct).toFixed(1)}% ${
            observedPerDay >= baseline ? 'above' : 'below'
          } the ${days}-day baseline (${baseline.toFixed(1)} ${unitLabel} vs ${observedPerDay.toFixed(
            1,
          )} ${unitLabel}).`;

    return {
      siteId: site.id,
      siteName: site.name,
      metric,
      value,
      days,
      baseline,
      dailyStdDev: sd,
      observedPerDay: Math.round(observedPerDay * 100) / 100,
      deviationPct: Math.round(deviationPct * 10) / 10,
      zScore: zScore === null ? null : Math.round(zScore * 100) / 100,
      surprised: severity !== 'LOW',
      severity,
      thresholds: { zScore: Z_FLAG, deviationPct: PCT_FLAG },
      explanation,
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private verdict(
    metric: BaselineMetric,
    unit: 'count' | 'ms',
    aggregation: 'sum' | 'mean',
    baselineValues: number[],
    actual: number,
    actualDays: number,
  ): BaselineVerdict {
    const sampleDays = baselineValues.length;

    if (sampleDays === 0) {
      // Nothing to compare against — only an increase is noteworthy on its own.
      return {
        metric,
        unit,
        aggregation,
        baseline: null,
        dailyStdDev: null,
        expected: null,
        actual,
        deviation: null,
        deviationPct: null,
        zScore: null,
        direction: actual > 0 ? 'UP' : 'FLAT',
        flagged: actual > 0,
        sampleDays: 0,
      };
    }

    const baseline = mean(baselineValues);
    const sd = stddev(baselineValues);
    const expected = aggregation === 'sum' ? baseline * actualDays : baseline;
    const deviation = actual - expected;
    const deviationPct = expected === 0 ? (actual > 0 ? 100 : 0) : (deviation / expected) * 100;
    const observedPerDay = aggregation === 'sum' ? actual / actualDays : actual;
    const zScore = sd > 0 ? (observedPerDay - baseline) / sd : null;
    const flagged =
      (zScore !== null && Math.abs(zScore) >= Z_FLAG) || Math.abs(deviationPct) >= PCT_FLAG;

    return {
      metric,
      unit,
      aggregation,
      baseline: Math.round(baseline * 100) / 100,
      dailyStdDev: Math.round(sd * 100) / 100,
      expected: Math.round(expected * 100) / 100,
      actual: Math.round(actual * 100) / 100,
      deviation: Math.round(deviation * 100) / 100,
      deviationPct: Math.round(deviationPct * 10) / 10,
      zScore: zScore === null ? null : Math.round(zScore * 100) / 100,
      direction: Math.abs(deviationPct) < 1 ? 'FLAT' : deviation > 0 ? 'UP' : 'DOWN',
      flagged,
      sampleDays,
    };
  }
}
