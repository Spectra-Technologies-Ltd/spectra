import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  generateKeyPairSync,
  createECDH,
  createSign,
  createCipheriv,
  hkdfSync,
  randomBytes,
} from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const VAPID_KEYS_FILE = join(process.cwd(), 'vapid-keys.json');

interface VapidKeys {
  publicKey: string; // base64url uncompressed 65-byte point
  privateKey: string; // base64url 32-byte private scalar
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Convert a DER ECDSA signature to the raw r||s form used in JWT. */
function derToRawSignature(der: Buffer, size = 32): Buffer {
  let offset = 0;
  if (der[offset] !== 0x30) throw new Error('Invalid DER signature');
  offset += 2;
  const readInt = () => {
    if (der[offset] !== 0x02) throw new Error('Invalid DER integer');
    let len = der[offset + 1];
    let start = offset + 2;
    offset = start + len;
    // Strip leading zero padding
    while (len > 1 && der[start] === 0x00) {
      start++;
      len--;
    }
    const buf = Buffer.alloc(size);
    const copy = Math.min(len, size);
    der.copy(buf, size - copy, start, start + copy);
    return buf;
  };
  const r = readInt();
  const s = readInt();
  return Buffer.concat([r, s]);
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapid!: VapidKeys;
  private readonly subject = process.env.VAPID_SUBJECT || 'mailto:ops@spectra.technology';

  onModuleInit() {
    this.vapid = this.loadOrCreateKeys();
    this.logger.log('Web Push ready (VAPID keys loaded)');
  }

  getPublicKey(): string {
    return this.vapid.publicKey;
  }

  private loadOrCreateKeys(): VapidKeys {
    if (existsSync(VAPID_KEYS_FILE)) {
      try {
        const parsed = JSON.parse(readFileSync(VAPID_KEYS_FILE, 'utf8'));
        if (parsed.publicKey && parsed.privateKey) return parsed;
      } catch {
        this.logger.warn('Could not parse vapid-keys.json — regenerating');
      }
    }
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });
    const keys: VapidKeys = {
      publicKey: publicKey
        .export({ type: 'spki', format: 'der' })
        .subarray(-65)
        .toString('base64url'),
      privateKey: privateKey
        .export({ type: 'pkcs8', format: 'der' })
        .subarray(-32)
        .toString('base64url'),
    };
    try {
      writeFileSync(VAPID_KEYS_FILE, JSON.stringify(keys));
    } catch (err) {
      this.logger.warn(`Could not persist VAPID keys: ${(err as Error).message}`);
    }
    this.logger.log('Generated new VAPID keypair');
    return keys;
  }

  /** Build the VAPID Authorization header value for an endpoint's origin. */
  private vapidHeader(endpoint: string): string {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const now = Math.floor(Date.now() / 1000);

    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url');
    const claims = Buffer.from(
      JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: this.subject }),
    ).toString('base64url');

    const sign = createSign('sha256');
    sign.update(`${header}.${claims}`);
    const der = sign.sign({
      key: Buffer.from(
        `-----BEGIN PRIVATE KEY-----\n${this.b64urlToB64(this.vapid.privateKey)}\n-----END PRIVATE KEY-----\n`,
      ),
      format: 'der',
      type: 'pkcs8',
    });
    const raw = derToRawSignature(der);
    const token = `${header}.${claims}.${raw.toString('base64url')}`;

    return `vapid t=${token}, k=${this.vapid.publicKey}`;
  }

  private b64urlToB64(s: string): string {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    return s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  }

  /**
   * Encrypt a payload for a push subscription (RFC 8291 aes128gcm scheme).
   * Returns { body, headers } ready for the POST to the push service.
   */
  private encryptPayload(
    sub: PushSubscriptionRow,
    payload: Buffer,
  ): { body: Buffer; headers: Record<string, string> } {
    const uaPublic = Buffer.from(this.b64urlToB64(sub.p256dh), 'base64');
    const authSecret = Buffer.from(this.b64urlToB64(sub.auth), 'base64');
    const asPublic = Buffer.from(this.b64urlToB64(this.vapid.publicKey), 'base64');

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(Buffer.from(this.b64urlToB64(this.vapid.privateKey), 'base64'));
    const sharedSecret = ecdh.computeSecret(uaPublic); // 32 bytes

    // HKDF (RFC 5869) with sha256 via hkdfSync
    const authInfo = Buffer.concat([
      Buffer.from('WebPush: info', 'utf8'),
      Buffer.from([0x00]),
      uaPublic,
      asPublic,
    ]);
    const ikm = Buffer.from(hkdfSync('sha256', sharedSecret, authSecret, authInfo, 32));

    const keyInfo = Buffer.concat([
      Buffer.from('Content-Encoding: aes128gcm', 'utf8'),
      Buffer.from([0x00]),
      uaPublic,
      asPublic,
    ]);
    const cek = Buffer.from(hkdfSync('sha256', ikm, Buffer.alloc(0), keyInfo, 16));

    const nonceInfo = Buffer.concat([
      Buffer.from('Content-Encoding: nonce', 'utf8'),
      Buffer.from([0x00]),
      uaPublic,
      asPublic,
    ]);
    const nonce = Buffer.from(hkdfSync('sha256', ikm, Buffer.alloc(0), nonceInfo, 12));

    // aes128gcm record: first 2 bytes = padding length (BE), then that many
    // bytes of padding, then the plaintext. 16 bytes of padding minimum.
    const record = Buffer.alloc(payload.length + 2 + 16);
    record.writeUInt16BE(16, 0);
    payload.copy(record, 2 + 16);

    const cipher = createCipheriv('aes-128-gcm', cek, nonce);
    const ciphertext = Buffer.concat([cipher.update(record), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Record header: salt(16) || rs(4 BE) || idlen(1) || id(65)
    const salt = randomBytes(16);
    const rs = 4096;
    const body = Buffer.concat([
      salt,
      Buffer.from([(rs >>> 24) & 0xff, (rs >>> 16) & 0xff, (rs >>> 8) & 0xff, rs & 0xff]),
      Buffer.from([asPublic.length]),
      asPublic,
      ciphertext,
      tag,
    ]);

    return {
      body,
      headers: {
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: '2419200',
        Urgency: 'high',
      },
    };
  }

  /**
   * Send a push notification to a single subscription. Returns the HTTP status
   * (0 on local error). A 404/410 means the subscription is dead.
   */
  async send(sub: PushSubscriptionRow, title: string, body: string, url?: string): Promise<number> {
    try {
      const payload = Buffer.from(JSON.stringify({ title, body, url: url ?? '/', ts: Date.now() }));
      const { body: encrypted, headers } = this.encryptPayload(sub, payload);

      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: this.vapidHeader(sub.endpoint),
        },
        body: encrypted as unknown as BodyInit,
      });

      if (res.status === 404 || res.status === 410) {
        this.logger.warn('Push subscription expired — remove it');
        return res.status;
      }
      if (res.status >= 400) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Push send failed (${res.status}): ${text.slice(0, 200)}`);
      }
      return res.status;
    } catch (err) {
      this.logger.warn(`Push send error: ${(err as Error).message}`);
      return 0;
    }
  }
}
