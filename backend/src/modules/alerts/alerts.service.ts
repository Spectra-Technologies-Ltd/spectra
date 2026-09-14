import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BaselinesService } from '../baselines/baselines.service';
import { RealtimeService } from '../realtime/realtime.service';

export const ALERT_CODES = ['INCIDENT_SURGE', 'CRITICAL_INCIDENT', 'ANOMALY'] as const;
export type AlertCode = (typeof ALERT_CODES)[number];

/** A surge is this many incidents inside the window below. */
export const SURGE_THRESHOLD = 5;
export const SURGE_WINDOW_MINUTES = 10;
/** Surprise score at or above which an observation counts as an anomaly. */
export const ANOMALY_THRESHOLD = 0.9;

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
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  incidentId?: string;
  windowStart: Date;
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
    const windowStart = new Date(Date.now() - SURGE_WINDOW_MINUTES * 60_000);
    const recentCount = await this.prisma.incident.count({
      where: { siteId: incident.siteId, reportedAt: { gte: windowStart } },
    });

    const created = [];

    if (recentCount >= SURGE_THRESHOLD) {
      const alert = await this.raiseOnce({
        organizationId,
        siteId: incident.siteId,
        code: 'INCIDENT_SURGE',
        severity: 'WARNING',
        title: `Incident surge at ${siteName}`,
        message: `${recentCount} incidents reported at ${siteName} in the last ${SURGE_WINDOW_MINUTES} minutes (threshold ${SURGE_THRESHOLD}).`,
        metadata: {
          count: recentCount,
          threshold: SURGE_THRESHOLD,
          windowMinutes: SURGE_WINDOW_MINUTES,
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
        title: `Critical incident at ${siteName}`,
        message: `A CRITICAL ${incident.incidentType} incident was reported at ${siteName}.`,
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
    if (surprise.surprise >= ANOMALY_THRESHOLD) {
      const alert = await this.raiseOnce({
        organizationId,
        siteId: incident.siteId,
        code: 'ANOMALY',
        severity: 'WARNING',
        title: `Anomalous incident volume at ${siteName}`,
        message: `INCIDENT_COUNT of ${recentCount} scores ${surprise.surprise} surprise against the site baseline (mean ${surprise.baselineMean}, z ${surprise.zScore}).`,
        metadata: { ...surprise, value: recentCount, threshold: ANOMALY_THRESHOLD },
        incidentId: incident.id,
        windowStart,
      });
      if (alert) created.push(alert);
    }

    return created;
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
      title: a.title,
      message: a.message,
      siteId: a.siteId,
      siteName: a.site?.name ?? null,
      incidentId: a.incidentId,
      metadata: safeParse(a.metadata),
      createdAt: a.createdAt,
    }));
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
