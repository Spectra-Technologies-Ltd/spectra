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

/** Percentile of a sample, with linear interpolation between neighbours. */
const percentile = (xs: number[], p: number) => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
};

/** Empirical share of baseline samples at or below `value`, as a percentage. */
const empiricalPercentile = (xs: number[], value: number) => {
  if (xs.length === 0) return null;
  const atOrBelow = xs.filter((x) => x <= value).length;
  return Math.round((atOrBelow / xs.length) * 100);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

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

  /**
   * Ordered day keys, oldest first. `skip` excludes the most recent day(s) —
   * a baseline should describe completed days, never the day being measured.
   */
  private dayKeys(days: number, now = Date.now(), skip = 0): string[] {
    const keys: string[] = [];
    for (let i = days - 1 + skip; i >= skip; i--) {
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
  async getComparison(
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

  // ── Baseline statistics ───────────────────────────────────────────────────

  /**
   * Daily samples per metric over the last `days`, used as the site's baseline.
   *
   * - LATE_COUNT: samples only on days that have attendance (data days).
   * - INCIDENT_COUNT: every day in the window (zeros included).
   * - PATROL_DURATION_MS: daily mean duration, on days with completed patrols.
   */
  private async collectBaseline(organizationId: string, siteId: string, days: number) {
    const now = Date.now();
    const spanStart = this.startOfDay(new Date(now - days * DAY_MS));
    // Exclude the in-progress day: comparing a day against a baseline that
    // contains that same day damps its own anomalies.
    const dayKeys = this.dayKeys(days, now, 1);

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

    const attendanceByDay = new Map<string, { total: number; late: number }>();
    for (const a of attendance) {
      const k = this.dayKey(a.checkInTime);
      const cur = attendanceByDay.get(k) ?? { total: 0, late: 0 };
      cur.total += 1;
      if (this.isLateRow(a)) cur.late += 1;
      attendanceByDay.set(k, cur);
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

    return {
      LATE_COUNT: dayKeys
        .map((k) => attendanceByDay.get(k))
        .filter((v): v is { total: number; late: number } => !!v && v.total > 0)
        .map((v) => v.late),
      INCIDENT_COUNT: dayKeys.map((k) => incidentsByDay.get(k) ?? 0),
      PATROL_DURATION_MS: dayKeys
        .map((k) => durationByDay.get(k))
        .filter((v): v is { total: number; n: number } => !!v)
        .map((v) => v.total / v.n),
    } satisfies Record<BaselineMetric, number[]>;
  }

  /**
   * Describe what is "normal" for a site: a baseline per metric with its
   * spread, 95th percentile and sample size.
   */
  async getBaselineStats(
    organizationId: string,
    siteId: string,
    days = DEFAULT_BASELINE_DAYS,
  ) {
    await this.assertSite(organizationId, siteId);
    const samples = await this.collectBaseline(organizationId, siteId, days);

    const summarise = (xs: number[]) => {
      if (xs.length === 0) {
        return { baselineMean: 0, baselineStdDev: 0, percentile95: 0, sampleSize: 0 };
      }
      return {
        baselineMean: round2(mean(xs)),
        baselineStdDev: round2(stddev(xs)),
        percentile95: round2(percentile(xs, 95)),
        sampleSize: xs.length,
      };
    };

    return {
      LATE_COUNT: summarise(samples.LATE_COUNT),
      INCIDENT_COUNT: summarise(samples.INCIDENT_COUNT),
      PATROL_DURATION_MS: summarise(samples.PATROL_DURATION_MS),
    };
  }

  /**
   * Surprise — how anomalous an observation is against the site's baseline.
   *
   * `surprise` is 0.3 at the mean (a baseline day is never a total surprise)
   * and approaches 1 as the value moves away: 1 - 0.7 * exp(-z^2 / 2).
   */
  async getSurprise(
    organizationId: string,
    siteId: string,
    metric: BaselineMetric,
    value: number,
    days = DEFAULT_BASELINE_DAYS,
  ) {
    await this.assertSite(organizationId, siteId);
    const samples = (await this.collectBaseline(organizationId, siteId, days))[metric];

    if (samples.length === 0) {
      return {
        surprise: value > 0 ? 1 : 0,
        percentile: value > 0 ? 100 : 0,
        zScore: null,
        baselineMean: 0,
      };
    }

    const baselineMean = mean(samples);
    const sd = stddev(samples);
    const zScore = sd > 0 ? (value - baselineMean) / sd : null;
    const surprise =
      zScore === null
        ? value > baselineMean
          ? 1
          : 0.3
        : 1 - 0.7 * Math.exp(-(zScore * zScore) / 2);

    return {
      surprise: round2(surprise),
      percentile: empiricalPercentile(samples, value) ?? 0,
      zScore: zScore === null ? null : round2(zScore),
      baselineMean: round2(baselineMean),
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
