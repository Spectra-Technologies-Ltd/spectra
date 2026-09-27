import { Injectable, Logger } from '@nestjs/common';

export type SmsResult =
  | { ok: true; provider: string; messageId?: string }
  | { ok: false; provider: string; error: string };

interface TermiiResponse {
  message_id?: string;
  message?: string;
}

interface TwilioResponse {
  sid?: string;
  message?: string;
}

/**
 * Outbound SMS with zero dependencies. Configure one provider via env:
 *
 *   SMS_PROVIDER=termii   → TERMII_API_KEY, TERMII_SENDER_ID
 *   SMS_PROVIDER=twilio   → TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *
 * When unconfigured, `send` returns `ok: false` rather than pretending to
 * deliver — the caller records the notification as FAILED so the gap is visible
 * instead of silent.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  get provider(): string {
    return (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  }

  get isConfigured(): boolean {
    if (this.provider === 'termii') return Boolean(process.env.TERMII_API_KEY);
    if (this.provider === 'twilio') {
      return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
      );
    }
    return false;
  }

  async send(to: string, message: string): Promise<SmsResult> {
    if (!to)
      return {
        ok: false,
        provider: this.provider || 'none',
        error: 'No recipient',
      };

    if (!this.isConfigured) {
      this.logger.warn(`SMS not configured — dropping message to ${to}`);
      return {
        ok: false,
        provider: this.provider || 'none',
        error:
          'SMS provider is not configured (set SMS_PROVIDER and its credentials)',
      };
    }

    try {
      return this.provider === 'termii'
        ? await this.sendViaTermii(to, message)
        : await this.sendViaTwilio(to, message);
    } catch (err) {
      const error = (err as Error).message;
      this.logger.error(`SMS to ${to} failed: ${error}`);
      return { ok: false, provider: this.provider, error };
    }
  }

  private async sendViaTermii(to: string, message: string): Promise<SmsResult> {
    const res = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to,
        from: process.env.TERMII_SENDER_ID || 'Spectra',
        sms: message,
        type: 'plain',
        channel: process.env.TERMII_CHANNEL || 'generic',
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const body = (await res.json().catch(() => ({}))) as TermiiResponse;
    if (!res.ok || !body.message_id) {
      return {
        ok: false,
        provider: 'termii',
        error: body.message ?? `Termii responded ${res.status}`,
      };
    }
    return { ok: true, provider: 'termii', messageId: body.message_id };
  }

  private async sendViaTwilio(to: string, message: string): Promise<SmsResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(
      `${sid}:${process.env.TWILIO_AUTH_TOKEN}`,
    ).toString('base64');

    const form = new URLSearchParams({
      To: to,
      From: process.env.TWILIO_FROM_NUMBER!,
      Body: message,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        signal: AbortSignal.timeout(15_000),
      },
    );

    const body = (await res.json().catch(() => ({}))) as TwilioResponse;
    if (!res.ok) {
      return {
        ok: false,
        provider: 'twilio',
        error: body.message ?? `Twilio responded ${res.status}`,
      };
    }
    return { ok: true, provider: 'twilio', messageId: body.sid ?? '' };
  }
}
