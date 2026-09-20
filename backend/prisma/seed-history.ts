import { PrismaClient } from '@prisma/client';

/**
 * Historical activity generator — 30 days of incidents and patrols so
 * Napoleon's baselines have real spread. Shared by the main seed and by
 * `npm run seed:alerts`.
 *
 * Timestamps are always relative to the run, and history ends yesterday so a
 * live day starts clean (baselines exclude the in-progress day).
 */

export const HISTORY_DAYS = 30;

const INCIDENT_TYPES = [
  'THEFT',
  'TRESPASS',
  'ASSAULT',
  'FIRE',
  'MEDICAL',
  'ASSET_DAMAGE',
  'OTHER',
];

/** Weighted so MEDIUM/HIGH dominate, as real incident logs do. */
const SEVERITIES = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL'];

/** Deterministic PRNG so the generated history is reproducible across runs. */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export type HistorySite = {
  siteId: string;
  siteName: string;
  routeId: string;
  guardIds: string[];
};

export type HistoryOptions = {
  reporterId: string;
  sites: HistorySite[];
  days?: number;
  now?: Date;
};

export async function generateHistory(prisma: PrismaClient, opts: HistoryOptions) {
  const days = opts.days ?? HISTORY_DAYS;
  const now = opts.now ?? new Date();
  const rand = mulberry32(20260914);
  const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];

  let incidents = 0;
  let patrols = 0;

  for (let dayOffset = days; dayOffset >= 1; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    day.setHours(0, 0, 0, 0);

    for (let s = 0; s < opts.sites.length; s++) {
      const cfg = opts.sites[s];

      // Incidents: 1-4 per site per day, with the occasional quiet day.
      const incidentsToday = rand() < 0.15 ? 0 : 1 + Math.floor(rand() * 4);
      for (let n = 0; n < incidentsToday; n++) {
        const occurredAt = new Date(day);
        occurredAt.setHours(6 + Math.floor(rand() * 17), Math.floor(rand() * 60), 0, 0);
        const type = pick(INCIDENT_TYPES);
        const severity = pick(SEVERITIES);
        const isOpen = rand() < 0.2;
        const id = `seed-incident-h-${s}-${dayOffset}-${n}`;

        await prisma.incident.upsert({
          where: { id },
          update: { reportedAt: occurredAt, occurrenceTime: occurredAt },
          create: {
            id,
            title: `${type} reported at ${cfg.siteName}`,
            incidentType: type,
            occurrenceTime: occurredAt,
            reportedAt: occurredAt,
            status: isOpen ? 'OPEN' : 'CLOSED',
            siteId: cfg.siteId,
            reporterId: opts.reporterId,
            guardsInvolved: JSON.stringify([cfg.guardIds[0] ?? '']),
            description: `Routine log entry for ${cfg.siteName}. The guard on duty recorded the event and followed the standard escalation path.`,
            severity,
            photos: '[]',
            videos: '[]',
            voiceNotes: '[]',
            witnesses: '[]',
            actionsTaken: isOpen
              ? 'Escalated to the operations supervisor for follow-up.'
              : 'Resolved on site; no further action required.',
            investigationStatus: isOpen ? 'OPEN' : 'CLOSED',
          },
        });
        incidents++;
      }

      // Patrols: 2-3 completed per day, each lasting 22-48 minutes.
      const patrolsToday = 2 + Math.floor(rand() * 2);
      for (let n = 0; n < patrolsToday; n++) {
        const startedAt = new Date(day);
        startedAt.setHours(7 + n * 6 + Math.floor(rand() * 2), Math.floor(rand() * 60), 0, 0);
        const durationMs = Math.round((22 + rand() * 26) * 60 * 1000);
        const endedAt = new Date(startedAt.getTime() + durationMs);
        const id = `seed-patrol-h-${s}-${dayOffset}-${n}`;

        await prisma.patrolRecord.upsert({
          where: { id },
          update: { startTime: startedAt, endTime: endedAt },
          create: {
            id,
            routeId: cfg.routeId,
            guardId: cfg.guardIds[n % cfg.guardIds.length],
            startTime: startedAt,
            endTime: endedAt,
            status: 'COMPLETED',
            scannedCheckpoints: JSON.stringify([]),
            missedCheckpoints: '[]',
            completionPercentage: 70 + Math.floor(rand() * 31),
            generalNotes: 'Historical patrol record (seeded for baseline modelling).',
          },
        });
        patrols++;
      }
    }
  }

  return { incidents, patrols };
}

/** Resolve seeded sites, their patrol routes and guards straight from the DB. */
export async function resolveHistorySites(prisma: PrismaClient): Promise<{
  organizationId: string;
  reporterId: string;
  sites: HistorySite[];
}> {
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!organization) throw new Error('No organization found — run the base seed first.');

  const admin = await prisma.user.findFirst({
    where: { organizationId: organization.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!admin) throw new Error('No user found — run the base seed first.');

  const sites = await prisma.site.findMany({
    where: { organizationId: organization.id },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      patrolRoutes: { select: { id: true }, take: 1 },
      guards: { select: { id: true }, take: 2 },
    },
  });

  const resolved: HistorySite[] = [];
  for (const site of sites) {
    const route = site.patrolRoutes[0];
    if (!route || site.guards.length === 0) continue;
    resolved.push({
      siteId: site.id,
      siteName: site.name,
      routeId: route.id,
      guardIds: site.guards.map((g) => g.id),
    });
  }
  if (resolved.length === 0) {
    throw new Error('No site with a patrol route and guards found — run the base seed first.');
  }

  return { organizationId: organization.id, reporterId: admin.id, sites: resolved };
}
