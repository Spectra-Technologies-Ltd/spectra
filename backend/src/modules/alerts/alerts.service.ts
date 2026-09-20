import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BaselinesService } from '../baselines/baselines.service';
import { RealtimeService } from '../realtime/realtime.service';

export const ALERT_CODES = ['INCIDENT_SURGE', 'CRITICAL_INCIDENT', 'ANOMALY'] as const;
export type AlertCode = (typeof ALERT_CODES)[number];

/**
 * Tuning knobs are read lazily: module imports are evaluated before dotenv
 * runs in main.ts, so reading process.env at import time would ignore .env.
 */
const envNumber = (key: string, fallback: number) => {
  const raw = process.env[key];
  const value = raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const alertConfig = () => ({
  /** A surge is this many incidents inside the window below. */
  surgeThreshold: envNumber('ALERTS_SURGE_THRESHOLD', 5),
  surgeWindowMinutes: envNumber('ALERTS_SURGE_WINDOW_MINUTES', 10),
  /** Surprise score at or above which an observation counts as an anomaly. */
  anomalyThreshold: envNumber('ALERTS_ANOMALY_THRESHOLD', 0.9),
});

/** Ranked-feed priorities. Anomalies score their surprise out of 100. */
export const CRITICAL_SCORE = 100;
export const SURGE_SCORE = 50;

export type IncidentForAlert = {
  id: string;
  siteId: string;
  severity: string;
  incidentType: string;
};

type RaiseInput = {
  organizationId: string;
  siteId: string;
  code: AlertCode;
  severity: 'WARNING' | 'CRITICAL';
  score: number;
  metric?: string;
  metricValue?: number;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  incidentId?: string;
  windowStart: Date;
};

/** One training row per event (triggered) or per quiet event (silent). */
type TrainingRow = {
  event_id: string;
  event_type: string;
  triggered: boolean;
  rules_triggered: string[];
  was_real: boolean | null;
  deviation_score: number | null;
  context: Record<string, unknown>;
};

/**
 * Alerts — anomalies worth an operator's attention, raised from live incident
 * traffic. Each rule is independent: a surge is a burst, a critical incident is
 * raised on sight, and an anomaly is a surprise score against the site baseline.
 */
@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    private baselines: BaselinesService,
    private realtime: RealtimeService,
  ) {}

  /**
   * Raise alerts for a reported incident. Returns the alerts created by this
   * call (empty when the incident is unremarkable, or when an alert of the
   * same kind was already raised inside the window).
   */
  async evaluateIncident(
    organizationId: string,
    incident: IncidentForAlert,
    siteName: string,
  ) {
    const { surgeThreshold, surgeWindowMinutes, anomalyThreshold } = alertConfig();
    const windowStart = new Date(Date.now() - surgeWindowMinutes * 60_000);
    const recentCount = await this.prisma.incident.count({
      where: { siteId: incident.siteId, reportedAt: { gte: windowStart } },
    });

    const created = [];

    if (recentCount >= surgeThreshold) {
      const alert = await this.raiseOnce({
        organizationId,
        siteId: incident.siteId,
        code: 'INCIDENT_SURGE',
        severity: 'WARNING',
        score: SURGE_SCORE,
        metric: 'INCIDENT_COUNT',
        metricValue: recentCount,
        title: `Incident surge at ${siteName}`,
        message: `${recentCount}+ incidents reported today`,
        metadata: {
          count: recentCount,
          threshold: surgeThreshold,
          windowMinutes: surgeWindowMinutes,
        },
        incidentId: incident.id,
        windowStart,
      });
      if (alert) created.push(alert);
    }

    if (incident.severity === 'CRITICAL') {
      const alert = await this.raiseOnce({
        organizationId,
        siteId: incident.siteId,
        code: 'CRITICAL_INCIDENT',
        severity: 'CRITICAL',
        score: CRITICAL_SCORE,
        title: `Critical incident at ${siteName}`,
        message: `CRITICAL incident reported at ${siteName}`,
        metadata: { incidentType: incident.incidentType },
        incidentId: incident.id,
        windowStart,
      });
      if (alert) created.push(alert);
    }

    const surprise = await this.baselines.getSurprise(
      organizationId,
      incident.siteId,
      'INCIDENT_COUNT',
      recentCount,
    );
    if (surprise.surprise >= anomalyThreshold) {
      const alert = await this.raiseOnce({
        organizationId,
        siteId: incident.siteId,
        code: 'ANOMALY',
        severity: 'WARNING',
        score: Math.round(surprise.surprise * 100),
        metric: 'INCIDENT_COUNT',
        metricValue: recentCount,
        title: `Anomalous incident volume at ${siteName}`,
        message: `Unusual INCIDENT_COUNT: ${recentCount} (baseline: ${surprise.baselineMean})`,
        metadata: { ...surprise, value: recentCount, threshold: anomalyThreshold },
        incidentId: incident.id,
        windowStart,
      });
      if (alert) created.push(alert);
    }

    return created;
  }

  /**
   * Ranked feed of unread alerts — critical incidents first (score 100), then
   * anomalies by surprise score, then surges.
   */
  async unread(organizationId: string, opts: { siteId?: string; limit?: number } = {}) {
    const where = {
      organizationId,
      isRead: false,
      ...(opts.siteId ? { siteId: opts.siteId } : {}),
    };

    const [count, alerts] = await Promise.all([
      this.prisma.alert.count({ where }),
      this.prisma.alert.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(opts.limit ?? 50, 200),
      }),
    ]);

    return { count, alerts: alerts.map((a) => toFeedItem(a)) };
  }

  /** Mark an alert as read so it drops out of the unread feed. */
  async markRead(organizationId: string, alertId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, organizationId },
      select: { id: true },
    });
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
      select: { id: true, isRead: true },
    });
  }

  /**
   * Label an alert's outcome — the training signal Phase 4 learns from. The
   * alert keeps the latest verdict while every label appends an AlertLog row,
   * so a re-labelled alert remains fully auditable.
   */
  async label(
    organizationId: string,
    alertId: string,
    dto: { wasReal: boolean; note?: string },
    userId: string,
  ) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, organizationId },
    });
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);

    await this.prisma.$transaction([
      this.prisma.alert.update({
        where: { id: alert.id },
        // Labelling is the operator's verdict, so it also clears the alert from
        // the unread feed.
        data: { wasReal: dto.wasReal, isRead: true },
      }),
      this.prisma.alertLog.create({
        data: {
          alertId: alert.id,
          wasReal: dto.wasReal,
          note: dto.note ?? null,
          labeledById: userId,
          rule: alert.code,
          severity: alert.severity,
          score: alert.score,
          metric: alert.metric,
          metricValue: alert.metricValue,
          siteId: alert.siteId,
        },
      }),
    ]);

    this.logger.log(`[${alert.code}] labelled wasReal=${dto.wasReal}`);

    return { success: true };
  }

  /** Recent alerts for the organization, newest first. */
  async list(organizationId: string, opts: { siteId?: string; limit?: number } = {}) {
    const alerts = await this.prisma.alert.findMany({
      where: {
        organizationId,
        ...(opts.siteId ? { siteId: opts.siteId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(opts.limit ?? 50, 200),
      include: { site: { select: { name: true } } },
    });

    return alerts.map((a) => ({
      id: a.id,
      code: a.code,
      severity: a.severity,
      score: a.score,
      metric: a.metric,
      metricValue: a.metricValue,
      title: a.title,
      message: a.message,
      siteId: a.siteId,
      siteName: a.site?.name ?? null,
      incidentId: a.incidentId,
      isRead: a.isRead,
      wasReal: a.wasReal,
      metadata: safeParse(a.metadata),
      createdAt: a.createdAt,
    }));
  }

  /**
   * Event-level training rows for Phase 4: one row per incident event that
   * triggered rules, with every rule it fired, the event's deviation score and
   * the operator's label (null while unlabeled).
   */
  async trainingData(
    organizationId: string,
    opts: { siteId?: string; limit?: number; includeSilent?: boolean } = {},
  ) {
    const alerts = await this.prisma.alert.findMany({
      where: {
        organizationId,
        ...(opts.siteId ? { siteId: opts.siteId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { site: { select: { name: true } } },
    });

    // Group by the incident that triggered the rules.
    const groups = new Map<string, typeof alerts>();
    for (const alert of alerts) {
      const eventId = alert.incidentId ?? alert.id;
      const list = groups.get(eventId) ?? [];
      list.push(alert);
      groups.set(eventId, list);
    }

    const incidents = await this.prisma.incident.findMany({
      where: { id: { in: [...groups.keys()] } },
      select: { id: true, incidentType: true, severity: true, reportedAt: true },
    });
    const incidentById = new Map(incidents.map((i) => [i.id, i]));

    const rows: TrainingRow[] = [...groups.entries()].map(([eventId, list]) => {
      const byScore = [...list].sort((a, b) => b.score - a.score);
      const top = byScore[0];
      // Rules on one event can be labelled separately; the strongest signal is
      // the most authoritative verdict for the event as a whole.
      const labelled = byScore.find((a) => a.wasReal !== null);
      const incident = incidentById.get(eventId);

      return {
        event_id: eventId,
        event_type: 'incident.created',
        triggered: true,
        rules_triggered: byScore.map((a) => a.code),
        was_real: labelled ? labelled.wasReal : null,
        deviation_score: Math.round(top.score) / 100,
        context: {
          siteId: top.siteId,
          siteName: top.site?.name ?? null,
          incidentType: incident?.incidentType ?? null,
          severity: incident?.severity ?? top.severity,
          reportedAt: incident?.reportedAt ?? null,
          metric: top.metric,
          metricValue: top.metricValue,
          rules: byScore.map((a) => ({
            rule: a.code,
            severity: a.severity,
            score: a.score,
            message: a.message,
            wasReal: a.wasReal,
            createdAt: a.createdAt,
          })),
        },
      };
    });

    // Highest deviation first — the rows a model should learn from most.
    rows.sort((a, b) => (b.deviation_score ?? -1) - (a.deviation_score ?? -1));

    // Incidents that triggered nothing are the negative class: real traffic
    // that correctly stayed quiet. Opt-in because it is a much longer list.
    if (opts.includeSilent) {
      const triggeredIds = [...groups.keys()];
      const silentIncidents = await this.prisma.incident.findMany({
        where: {
          site: { organizationId },
          ...(opts.siteId ? { siteId: opts.siteId } : {}),
          ...(triggeredIds.length > 0 ? { id: { notIn: triggeredIds } } : {}),
        },
        orderBy: { reportedAt: 'desc' },
        select: {
          id: true,
          siteId: true,
          incidentType: true,
          severity: true,
          reportedAt: true,
          site: { select: { name: true } },
        },
      });

      for (const incident of silentIncidents) {
        rows.push({
          event_id: incident.id,
          event_type: 'incident.created',
          triggered: false,
          rules_triggered: [],
          was_real: null,
          deviation_score: null,
          context: {
            siteId: incident.siteId,
            siteName: incident.site?.name ?? null,
            incidentType: incident.incidentType,
            severity: incident.severity,
            reportedAt: incident.reportedAt,
            metric: null,
            metricValue: null,
            rules: [],
          },
        });
      }
    }

    const limited = rows.slice(0, Math.min(opts.limit ?? 100, 500));

    // One sample per rule: alerts can be labelled individually, so this is the
    // shape that carries both real and false examples into training.
    const ruleRows = alerts.map((a) => ({
      event_id: a.incidentId ?? a.id,
      event_type: 'incident.created',
      rule: a.code,
      severity: a.severity,
      deviation_score: Math.round(a.score) / 100,
      metric: a.metric,
      metricValue: a.metricValue,
      site_id: a.siteId,
      was_real: a.wasReal,
      labelled: a.wasReal !== null,
      alert_id: a.id,
      raised_at: a.createdAt,
    }));

    return {
      count: limited.length,
      rows: limited,
      rule_count: ruleRows.length,
      rule_rows: ruleRows,
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Create the alert unless the same kind was already raised for this site
   * inside the window — a burst of incidents should surface one alert, not one
   * per incident.
   */
  private async raiseOnce(input: RaiseInput) {
    const existing = await this.prisma.alert.findFirst({
      where: {
        siteId: input.siteId,
        code: input.code,
        createdAt: { gte: input.windowStart },
      },
      select: { id: true },
    });
    if (existing) return null;

    const alert = await this.prisma.alert.create({
      data: {
        organizationId: input.organizationId,
        siteId: input.siteId,
        code: input.code,
        severity: input.severity,
        score: input.score,
        metric: input.metric,
        metricValue: input.metricValue,
        title: input.title,
        message: input.message,
        metadata: JSON.stringify(input.metadata),
        incidentId: input.incidentId,
      },
    });

    this.logger.log(`[${alert.code}] ${alert.title}`);

    this.realtime.publish(input.organizationId, 'alert:created', {
      id: alert.id,
      code: alert.code,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      siteId: alert.siteId,
      createdAt: alert.createdAt,
    });

    return alert;
  }
}

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

/** Shape used by the ranked feed: `rule` is the alert code. */
const toFeedItem = (a: {
  id: string;
  code: string;
  severity: string;
  score: number;
  metric: string | null;
  metricValue: number | null;
  message: string;
}) => ({
  id: a.id,
  rule: a.code,
  severity: a.severity,
  score: a.score,
  metric: a.metric,
  metricValue: a.metricValue,
  message: a.message,
});
