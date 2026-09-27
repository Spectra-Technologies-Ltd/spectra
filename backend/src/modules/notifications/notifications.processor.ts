import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../../common/mail/mailer.service';
import { SmsService } from '../../common/mail/sms.service';

const COMMAND_ROLES = ['CEO', 'OPERATIONS_MANAGER', 'HR', 'SUPERVISOR'];

interface IncidentAlertData {
  organizationId?: string;
  incidentId?: string;
  siteId?: string;
  siteName?: string;
  site?: { organizationId?: string };
  title?: string;
  type?: string;
  severity?: string;
  description?: string;
}

interface Recipient {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
}

/**
 * Out-of-band delivery for notifications. In-app notifications and web push are
 * handled synchronously in NotificationsService; this worker owns email and SMS,
 * which are slow and fail independently and therefore belong on a queue.
 *
 * Delivery failures are persisted as FAILED Notification rows so a broken SMTP
 * or SMS configuration shows up in the product instead of only in the logs.
 */
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly sms: SmsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'incident-alert':
        return this.handleIncidentAlert((job.data ?? {}) as IncidentAlertData);
      case 'attendance-report':
        return this.handleAttendanceReport(
          (job.data ?? {}) as { siteId?: string },
        );
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { skipped: true, reason: `unknown job ${job.name}` };
    }
  }

  // ── Incident alerts ────────────────────────────────────────────────────

  private async handleIncidentAlert(data: IncidentAlertData) {
    const organizationId = data.organizationId ?? data.site?.organizationId;
    if (!organizationId) {
      this.logger.warn(
        'Incident alert has no organizationId — cannot resolve recipients',
      );
      return { sent: 0, reason: 'missing organizationId' };
    }

    const recipients = await this.prisma.user.findMany({
      where: { organizationId, role: { in: COMMAND_ROLES }, isActive: true },
      select: { id: true, email: true, phone: true, firstName: true },
    });

    if (recipients.length === 0) {
      this.logger.warn(
        `No command staff to alert for organization ${organizationId}`,
      );
      return { sent: 0, reason: 'no recipients' };
    }

    const title = data.title ?? data.type ?? 'New incident';
    const site = data.siteName ?? 'site';
    const severity = data.severity ?? 'ALERT';

    const subject = `[${severity}] ${title} — ${site}`;
    const body = [
      `${severity} incident reported at ${site}.`,
      '',
      `Type:     ${data.type ?? '—'}`,
      `Title:    ${title}`,
      `Site:     ${site}`,
      data.description
        ? `Details:  ${String(data.description).slice(0, 500)}`
        : null,
      data.incidentId ? `\nReference: ${data.incidentId}` : null,
      '',
      'Open BastionOS for the full record.',
      '',
      '— BastionOS, built on Spectra',
    ]
      .filter((line) => line !== null)
      .join('\n');

    // Keep this under a single GSM segment where possible.
    const smsBody = `[${severity}] ${title} at ${site}. Open BastionOS for details.`;

    const email = await this.deliver(
      recipients,
      'EMAIL',
      this.mailer.isConfigured,
      (r) => this.mailer.send({ to: r.email, subject, text: body }),
    );
    const sms = await this.deliver(
      recipients.filter((r) => Boolean(r.phone)),
      'SMS',
      this.sms.isConfigured,
      (r) => this.sms.send(r.phone!, smsBody),
    );

    this.logger.log(
      `Incident alert ${data.incidentId ?? ''} delivered — email ${email.sent}/${email.attempted}, sms ${sms.sent}/${sms.attempted}`,
    );

    return { email, sms };
  }

  // ── Attendance report ──────────────────────────────────────────────────

  private async handleAttendanceReport(data: { siteId?: string }) {
    if (!data.siteId) return { sent: 0, reason: 'missing siteId' };

    const site = await this.prisma.site.findUnique({
      where: { id: data.siteId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        targetGuards: true,
      },
    });
    if (!site) {
      this.logger.warn(
        `Attendance report requested for unknown site ${data.siteId}`,
      );
      return { sent: 0, reason: 'unknown site' };
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const [records, onSite] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { siteId: site.id, createdAt: { gte: since } },
        select: {
          status: true,
          isLate: true,
          isAbsent: true,
          guard: { select: { fullName: true } },
        },
      }),
      this.prisma.guard.count({
        where: { assignedSiteId: site.id, status: 'ACTIVE' },
      }),
    ]);

    const late = records.filter((r) => r.isLate).length;
    const absent = records.filter((r) => r.isAbsent).length;
    const onTime = records.length - late - absent;

    const recipients = await this.prisma.user.findMany({
      where: {
        organizationId: site.organizationId,
        role: { in: COMMAND_ROLES },
        isActive: true,
      },
      select: { id: true, email: true, phone: true, firstName: true },
    });

    if (recipients.length === 0) {
      return { sent: 0, reason: 'no recipients' };
    }

    const subject = `Attendance — ${site.name} — ${new Date().toISOString().slice(0, 10)}`;
    const body = [
      `Attendance summary for ${site.name}.`,
      '',
      `Assigned guards:  ${onSite} (target ${site.targetGuards})`,
      `Check-ins today:  ${records.length}`,
      `On time:          ${onTime}`,
      `Late:             ${late}`,
      `Absent:           ${absent}`,
      '',
      absent > 0 || late > 0
        ? 'Follow up on the flagged check-ins before the next shift change.'
        : 'No exceptions recorded.',
      '',
      '— BastionOS, built on Spectra',
    ].join('\n');

    const email = await this.deliver(
      recipients,
      'EMAIL',
      this.mailer.isConfigured,
      (r) => this.mailer.send({ to: r.email, subject, text: body }),
    );

    this.logger.log(
      `Attendance report for ${site.name} — email ${email.sent}/${email.attempted}`,
    );
    return { email };
  }

  // ── Shared delivery helper ─────────────────────────────────────────────

  /**
   * Send to every recipient, count outcomes, and persist a FAILED Notification
   * row for each unsuccessful attempt so breakage is visible in the product.
   *
   * `configured` is passed explicitly because MailerService.send() no-ops with a
   * warning when SMTP is unset — without this check those no-ops would be
   * counted as successful deliveries.
   */
  private async deliver(
    recipients: Recipient[],
    channel: 'EMAIL' | 'SMS',
    configured: boolean,
    send: (recipient: Recipient) => Promise<unknown>,
  ): Promise<{ attempted: number; sent: number; failed: number }> {
    if (recipients.length === 0) {
      return { attempted: 0, sent: 0, failed: 0 };
    }

    if (!configured) {
      const reason = `${channel} delivery is not configured`;
      this.logger.warn(
        `${reason} — recording ${recipients.length} notification(s) as FAILED`,
      );
      await this.recordFailures(recipients, channel, reason);
      return {
        attempted: recipients.length,
        sent: 0,
        failed: recipients.length,
      };
    }

    let sent = 0;
    const failures: Array<{ recipient: Recipient; error: string }> = [];

    for (const recipient of recipients) {
      try {
        await send(recipient);
        sent += 1;
      } catch (err) {
        failures.push({ recipient, error: (err as Error).message });
      }
    }

    if (failures.length > 0) {
      this.logger.warn(
        `${channel} delivery failed for ${failures.length}/${recipients.length}: ${failures[0].error}`,
      );
      await this.recordFailures(
        failures.map((f) => f.recipient),
        channel,
        failures[0].error,
      );
    }

    return { attempted: recipients.length, sent, failed: failures.length };
  }

  private async recordFailures(
    recipients: Recipient[],
    channel: 'EMAIL' | 'SMS',
    error: string,
  ) {
    await this.prisma.notification
      .createMany({
        data: recipients.map((recipient) => ({
          userId: recipient.id,
          title: `${channel} delivery failed`,
          message: error.slice(0, 500),
          type: channel,
          status: 'FAILED',
        })),
      })
      .catch((err) =>
        this.logger.error(
          `Could not record delivery failures: ${(err as Error).message}`,
        ),
      );
  }
}
