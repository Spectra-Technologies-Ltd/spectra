import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { generateHistory, resolveHistorySites } from './seed-history';

// Unlike `prisma db seed`, this script runs without the Prisma CLI, so load
// backend/.env for DATABASE_URL before the client is constructed.
config({ path: resolve(__dirname, '..', '.env') });

/**
 * `npm run seed:alerts`
 *
 * Refreshes the 30 days of incidents and patrols that Napoleon's baselines are
 * measured against, and adds a small set of labelled alerts so the Phase 4
 * training set starts with both classes (real and false).
 */

const prisma = new PrismaClient();

type DemoAlert = {
  id: string;
  code: string;
  severity: string;
  score: number;
  metric: string | null;
  metricValue: number | null;
  title: string;
  message: string;
  metadata: string;
  incidentId: string;
  isRead: boolean;
  wasReal: boolean | null;
  createdAt: Date;
  label: { wasReal: boolean; note: string } | null;
};

async function seedLabelledAlerts(organizationId: string, reporterId: string) {
  const site = await prisma.site.findFirst({
    where: { organizationId },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });
  if (!site) return 0;

  const recent = await prisma.incident.findMany({
    where: { siteId: site.id },
    orderBy: { reportedAt: 'desc' },
    take: 2,
    select: { id: true },
  });
  if (recent.length === 0) return 0;
  const criticalEvent = recent[0];
  const anomalyEvent = recent[recent.length - 1];

  // Recreated each run; AlertLog rows cascade with their alert.
  await prisma.alert.deleteMany({ where: { id: { startsWith: 'seed-alert-' } } });

  const now = Date.now();
  const alerts: DemoAlert[] = [
    {
      id: 'seed-alert-critical',
      code: 'CRITICAL_INCIDENT',
      severity: 'CRITICAL',
      score: 100,
      metric: null,
      metricValue: null,
      title: `Critical incident at ${site.name}`,
      message: `CRITICAL incident reported at ${site.name}`,
      metadata: JSON.stringify({ incidentType: 'FIRE', seeded: true }),
      incidentId: criticalEvent.id,
      isRead: true,
      wasReal: true,
      createdAt: new Date(now - 45 * 60 * 1000),
      label: { wasReal: true, note: 'Confirmed fire — real event (seed sample)' },
    },
    {
      id: 'seed-alert-anomaly',
      code: 'ANOMALY',
      severity: 'WARNING',
      score: 92,
      metric: 'INCIDENT_COUNT',
      metricValue: 5,
      title: `Anomalous incident volume at ${site.name}`,
      message: 'Unusual INCIDENT_COUNT: 5 (baseline: 2.2)',
      metadata: JSON.stringify({
        surprise: 0.92,
        percentile: 97,
        zScore: 2.5,
        baselineMean: 2.2,
        value: 5,
        threshold: 0.9,
        seeded: true,
      }),
      incidentId: anomalyEvent.id,
      isRead: true,
      wasReal: false,
      createdAt: new Date(now - 30 * 60 * 1000),
      label: { wasReal: false, note: 'Duplicate report — false alarm (seed sample)' },
    },
    {
      id: 'seed-alert-surge',
      code: 'INCIDENT_SURGE',
      severity: 'WARNING',
      score: 50,
      metric: 'INCIDENT_COUNT',
      metricValue: 5,
      title: `Incident surge at ${site.name}`,
      message: '5+ incidents reported today',
      metadata: JSON.stringify({ count: 5, threshold: 5, windowMinutes: 10, seeded: true }),
      incidentId: anomalyEvent.id,
      isRead: false,
      wasReal: null,
      createdAt: new Date(now - 29 * 60 * 1000),
      label: null,
    },
  ];

  for (const demo of alerts) {
    const { label, ...alert } = demo;
    await prisma.alert.create({
      data: { ...alert, organizationId, siteId: site.id },
    });
    if (label) {
      await prisma.alertLog.create({
        data: {
          alertId: alert.id,
          wasReal: label.wasReal,
          note: label.note,
          labeledById: reporterId,
          rule: alert.code,
          severity: alert.severity,
          score: alert.score,
          metric: alert.metric,
          metricValue: alert.metricValue,
          siteId: site.id,
        },
      });
    }
  }

  return alerts.length;
}

async function main() {
  console.log('Seeding alerts history...');
  const { organizationId, reporterId, sites } = await resolveHistorySites(prisma);

  const { incidents, patrols } = await generateHistory(prisma, { reporterId, sites });
  console.log(`Created ${incidents} Historical Incidents`);
  console.log(`Created ${patrols} Historical Patrol Records`);

  const alertCount = await seedLabelledAlerts(organizationId, reporterId);
  console.log(`Created ${alertCount} Labelled Alerts`);

  console.log('Alerts seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
