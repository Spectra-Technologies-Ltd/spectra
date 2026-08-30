import { Injectable, Logger } from '@nestjs/common';
import type { Socket } from 'net';
import type { TLSSocket } from 'tls';

/**
 * Minimal SMTP client (zero dependencies).
 *   - SMTP_SECURE=true  → implicit TLS (port 465)
 *   - SMTP_SECURE=false → plain connect, opportunistic STARTTLS (port 587)
 * Configure via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 * If SMTP_HOST is unset, send() no-ops with a log — digests still land in the
 * notification queue so nothing is lost when credentials arrive later.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private get config() {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'BastionOS <ops@spectra.technology>',
      secure: process.env.SMTP_SECURE === 'true',
    };
  }

  get isConfigured(): boolean {
    return Boolean(this.config.host);
  }

  /**
   * A tiny SMTP conversation helper: sends commands, buffers lines, and
   * resolves each awaited command when a complete SMTP response arrives
   * (line 3 is a space). Swappable socket so STARTTLS upgrades are trivial.
   */
  private createSession(socket: Socket | TLSSocket) {
    let buffer = '';
    const waiters: Array<(resp: string) => void> = [];

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      let idx: number;
      while ((idx = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const code = line.slice(0, 3);
        const complete = line.length > 3 && line[3] === ' ';
        if (complete && waiters.length > 0) {
          waiters.shift()!(line);
        }
        // keep the code for multi-line continuation check
        void code;
      }
    };

    socket.on('data', onData);

    const session = {
      socket,
      command: (cmd: string): Promise<string> =>
        new Promise((resolve) => {
          waiters.push(resolve);
          socket.write(cmd + '\r\n');
        }),
      waitForGreeting: (): Promise<void> =>
        new Promise((resolve) => {
          waiters.push(() => resolve());
        }),
      destroy: () => socket.removeListener('data', onData),
    };

    return session;
  }

  async send(opts: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`SMTP not configured — skipping email "${opts.subject}"`);
      return;
    }

    const net = require('net');
    const tls = require('tls');
    const { host, port, secure, user, pass, from } = this.config;

    let socket: Socket | TLSSocket = secure
      ? tls.connect({ host, port })
      : net.connect({ host, port });

    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('error', reject);
    });

    const session = this.createSession(socket);
    let lastCode = '';

    try {
      await session.waitForGreeting();
      lastCode = (await session.command('EHLO bastion.local')).slice(0, 3);

      // Opportunistic STARTTLS on plain connections
      if (!secure && lastCode === '250' && (user || pass)) {
        const resp = await session.command('STARTTLS');
        if (resp.startsWith('220')) {
          const upgraded: TLSSocket = await new Promise((resolve, reject) => {
            const tlsSocket = tls.connect({ socket, rejectUnauthorized: false });
            tlsSocket.once('secureConnect', () => resolve(tlsSocket));
            tlsSocket.once('error', reject);
          });
          session.destroy();
          socket = upgraded;
          const upgradedSession = this.createSession(socket);
          await upgradedSession.waitForGreeting();
          await upgradedSession.command('EHLO bastion.local');
          await this.auth(upgradedSession, user!, pass!);
          await this.sendMail(upgradedSession, { ...opts, from });
          await upgradedSession.command('QUIT');
          upgradedSession.destroy();
          socket.end();
          return;
        }
      }

      if (user && pass) await this.auth(session, user, pass);
      await this.sendMail(session, { ...opts, from });
      await session.command('QUIT');
      this.logger.log(`Email sent: "${opts.subject}"`);
    } finally {
      session.destroy();
      socket.end();
    }
  }

  private async auth(session: any, user: string, pass: string) {
    const a = await session.command('AUTH LOGIN');
    if (!a.startsWith('334')) {
      // Try PLAIN as a fallback
      const plain = Buffer.from(`\0${user}\0${pass}`).toString('base64');
      const r = await session.command(`AUTH PLAIN ${plain}`);
      if (!r.startsWith('235')) throw new Error(`SMTP auth failed: ${r}`);
      return;
    }
    await session.command(Buffer.from(user).toString('base64'));
    const r = await session.command(Buffer.from(pass).toString('base64'));
    if (!r.startsWith('235')) throw new Error(`SMTP auth failed: ${r}`);
  }

  private async sendMail(
    session: any,
    opts: { from: string; to: string | string[]; subject: string; text: string; html?: string },
  ) {
    const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
    const fromAddr = opts.from.replace(/^.*<|>$/g, '').trim();

    await session.command(`MAIL FROM:<${fromAddr}>`);
    for (const to of recipients) {
      const resp = await session.command(`RCPT TO:<${to}>`);
      if (!resp.startsWith('2')) throw new Error(`RCPT rejected: ${resp}`);
    }
    await session.command('DATA');

    const headers = [
      `From: ${opts.from}`,
      `To: ${recipients.join(', ')}`,
      `Subject: ${opts.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${opts.html ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8'}`,
      '',
    ].join('\r\n');

    const body = (opts.html ?? opts.text).replace(/\r?\n/g, '\r\n');
    socketWrite(session, headers + '\r\n' + body + '\r\n.\r\n');
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

function socketWrite(session: any, data: string) {
  session.socket.write(data);
}
