import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac, randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const WINDOW = 1; // ±1 step for clock drift

function base32Encode(buffer: Buffer): string {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const rem = bits.length % 5;
  if (rem > 0) out += BASE32_ALPHABET[parseInt(bits.slice(bits.length - rem).padEnd(5, '0'), 2)];
  return out.replace(/=+$/, '');
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new BadRequestException('Invalid base32 secret');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Generate the 6-digit TOTP code for a secret at a given time (RFC 6238). */
export function generateTOTP(secret: string, time = Date.now()): string {
  const counter = Math.floor(time / 1000 / STEP_SECONDS);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, '0');
}

/** Constant-time-ish code comparison. */
function codesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

@Injectable()
export class TfaService {
  constructor(private prisma: PrismaService) {}

  /** Generate a new secret + otpauth URI for provisioning. */
  async startEnrollment(userId: string, email: string) {
    const secret = base32Encode(randomBytes(20));
    const uri = `otpauth://totp/BastionOS:${encodeURIComponent(email)}?secret=${secret}&issuer=BastionOS&algorithm=SHA1&digits=6&period=30`;

    // Persist pending secret (not yet active until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauthUri: uri };
  }

  /** Verify a code against a stored secret (with ±1 step drift window). */
  verifyCode(secret: string, code: string): boolean {
    if (!code || !/^\d{6}$/.test(code)) return false;
    const now = Date.now();
    for (let i = -WINDOW; i <= WINDOW; i++) {
      if (codesEqual(generateTOTP(secret, now + i * STEP_SECONDS * 1000), code)) {
        return true;
      }
    }
    return false;
  }

  /** Confirm enrollment — turns the pending secret into an active one. */
  async confirmEnrollment(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException('No pending 2FA enrollment');
    if (!this.verifyCode(user.twoFactorSecret, code)) {
      throw new BadRequestException('Invalid verification code');
    }
    const backupCodes = Array.from({ length: 8 }, () => randomBytes(4).toString('hex').toUpperCase());

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(
          backupCodes.map((c) => createHash('sha256').update(c).digest('hex')),
        ),
      },
    });

    // Return plaintext codes ONCE so the user can save them
    return { enabled: true, backupCodes };
  }

  /** Verify a backup code and consume it if valid. */
  private async consumeBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorBackupCodes) return false;
    const hashes: string[] = JSON.parse(user.twoFactorBackupCodes);
    const candidate = createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
    const idx = hashes.indexOf(candidate);
    if (idx === -1) return false;
    hashes.splice(idx, 1);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: JSON.stringify(hashes) },
    });
    return true;
  }

  /**
   * Verify a login attempt's 2FA code. Returns true if the code (or a valid
   * backup code) was accepted.
   */
  async verifyForLogin(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled) return true; // 2FA not enabled — nothing to verify
    if (user.twoFactorSecret && this.verifyCode(user.twoFactorSecret, code.trim())) return true;
    if (await this.consumeBackupCode(userId, code.trim())) return true;
    throw new UnauthorizedException('Invalid two-factor authentication code');
  }

  async disable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');
    if (user.twoFactorSecret && this.verifyCode(user.twoFactorSecret, code.trim())) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
        },
      });
      return { disabled: true };
    }
    throw new UnauthorizedException('Invalid two-factor authentication code');
  }
}
