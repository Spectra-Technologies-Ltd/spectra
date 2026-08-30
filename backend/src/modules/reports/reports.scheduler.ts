import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from './mailer.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Scheduled ops digests. Registers two repeatable BullMQ jobs on boot:
 *   - daily-digest  → every day at 06:00
 *   - weekly-digest → every Monday at 07:00
 * Each digest aggregates attendance/incidents/patrols for the window and is
 * emailed to DIGEST_EMAILS (or surfaced as in-app notifications when SMTP or
 * recipients aren't configured yet).
 */
@Injectable()
export class ReportScheduler implements OnModuleInit {
  private readonly logger = new Logger(ReportScheduler.name);

  constructor(
    @InjectQueue('reports') private reportsQueue: Queue,
    private prisma: PrismaService,
    private mailer: MailerService,
    private notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    try {
      await this.reportsQueue.upsertJobScheduler(
        'daily-digest',
        { pattern: '0 6 * * *' },
        { name: 'daily-digest', data: {}, opts: { removeOnComplete: 100 } },
      );
      await this.reportsQueue.upsertJobScheduler(
        'weekly-digest',
        { pattern: '0 7 * * 1' },
        { name: 'weekly-digest', data: {}, opts: { removeOnComplete: 100 } },
      );
      this.logger.log('Report schedulers registered (daily 06:00, weekly Mon 07:00)');
    } catch (err) {
      this.logger.warn(`Could not register report schedulers: ${(err as Error).message}`);
    }
  }
}

@Processor('reports')
export class ReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
    private notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'daily-digest':
        return this.sendDigest('daily');
      case 'weekly-digest':
        return this.sendDigest('weekly');
      default:
        this.logger.warn(`Unknown report job: ${job.name}`);
    }
  }

  private async sendDigest(kind: 'daily' | 'weekly') {
    const days = kind === 'daily' ? 1 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const organizations = await this.prisma.organization.findMany({
      select: { id: true, name: true },
    });

    for (const org of organizations) {
      try {
        const [incidents, attendance, guards, patrolRecords] = await Promise.all([
          this.prisma.incident.findMany({
            where: { site: { organizationId: org.id }, reportedAt: { gte: since } },
            select: { title: true, severity: true, status: true, site: { select: { name: true } }, reportedAt: true },
            orderBy: { reportedAt: 'desc' },
          }),
          this.prisma.attendance.findMany({
            where: { guard: { organizationId: org.id }, createdAt: { gte: since } },
            select: { isLate: true, isAbsent: true, status: true },
          }),
          this.prisma.guard.findMany({
            where: { organizationId: org.id, status: 'ACTIVE' },
            select: { fullName: true, performanceScore: true },
          }),
          this.prisma.patrolRecord.findMany({
            where: { guard: { organizationId: org.id }, createdAt: { gte: since } },
            select: { completionPercentage: true },
          }),
        ]);

        const lateCount = attendance.filter((a) => a.isLate || a.status === 'FLAGGED').length;
        const absentCount = attendance.filter((a) => a.isAbsent || a.status === 'ABSENT').length;
        const openIncidents = incidents.filter((i) => i.status === 'OPEN').length;
        const avgPatrol =
          patrolRecords.length === 0
            ? 100
            : Math.round(
                (patrolRecords.reduce((s, p) => s + p.completionPercentage, 0) /
                  patrolRecords.length) *
                  10,
              ) / 10;

        const lines = [
          `${org.name} — ${kind === 'daily' ? 'Daily' : 'Weekly'} Operations Digest`,
          `Generated: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })} (WAT)`,
          `Window: last ${days} day(s)`,
          '',
          `Open incidents:  ${openIncidents} / ${incidents.length} total`,
          `Late/flagged check-ins: ${lateCount}`,
          `Absent days:      ${absentCount}`,
          `Avg patrol completion: ${avgPatrol}%`,
          `Active guards:    ${guards.length}`,
          '',
          'RECENT INCIDENTS',
          incidents.length === 0
            ? '  (none)'
            : incidents
                .slice(0, 10)
                .map(
                  (i) =>
                    `  [${i.severity}] ${i.title} @ ${i.site?.name ?? '—'} (${i.status})`,
                )
                .join('\n'),
          '',
          '— BastionOS, built on Spectra',
        ].join('\n');

        const recipients = (process.env.DIGEST_EMAILS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        if (recipients.length > 0 && this.mailer.isConfigured) {
          await this.mailer.send({
            to: recipients,
            subject: `${org.name} — ${kind === 'daily' ? 'Daily' : 'Weekly'} Ops Digest`,
            text: lines,
          });
        }

        // Always mirror a summary into in-app notifications for staff
        const staff = await this.prisma.user.findMany({
          where: { organizationId: org.id, role: { in: ['CEO', 'OPERATIONS_MANAGER', 'HR'] }, isActive: true },
          select: { id: true },
        });
        for (const user of staff) {
          await this.notifications
            .create(
              user.id,
              org.id,
              `${kind === 'daily' ? 'Daily' : 'Weekly'} ops digest ready`,
              `${openIncidents} open incidents · ${lateCount} late check-ins · ${absentCount} absent · patrol ${avgPatrol}%`,
              'IN_APP',
              '/reports',
            )
            .catch(() => {});
        }

        this.logger.log(`Digest generated for ${org.name}`);
      } catch (err) {
        this.logger.error(`Digest failed for ${org.id}: ${(err as Error).message}`);
      }
    }
  }
}
