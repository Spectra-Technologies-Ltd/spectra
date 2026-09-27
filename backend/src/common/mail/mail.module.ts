import { Global, Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';

/**
 * Outbound messaging, available application-wide. Both services are
 * configuration-driven: with no credentials they report `isConfigured === false`
 * so callers can record an honest FAILED state instead of claiming success.
 */
@Global()
@Module({
  providers: [MailerService, SmsService],
  exports: [MailerService, SmsService],
})
export class MailModule {}
