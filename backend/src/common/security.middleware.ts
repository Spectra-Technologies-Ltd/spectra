import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitRule {
  /** Human-readable name, used in logs. */
  name: string;
  match: (req: Request) => boolean;
  limit: number;
  windowMs: number;
  /**
   * Auth routes refund the attempt when the response succeeds, so a legitimate
   * user never locks themselves out with quick retries. Abuse-prone endpoints
   * do not refund — every request costs budget.
   */
  refundOnSuccess: boolean;
}

/**
 * Zero-dependency hardening:
 * 1. Security headers (CSP, frame protection, MIME sniffing, referrer).
 * 2. Sliding-window rate limiting for auth endpoints (login/register/tfa) to
 *    blunt credential stuffing, and for the public lead endpoint to keep the
 *    marketing forms from being used as a spam relay.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private buckets = new Map<string, Bucket>();

  private readonly rules: RateLimitRule[] = [
    {
      name: 'auth',
      match: (req) => /^\/api\/v1\/auth\/(login|register|tfa)/.test(req.path),
      limit: 10,
      windowMs: 15 * 60 * 1000,
      refundOnSuccess: true,
    },
    {
      name: 'leads',
      match: (req) => req.method === 'POST' && req.path === '/api/v1/leads',
      limit: 6,
      windowMs: 10 * 60 * 1000,
      refundOnSuccess: false,
    },
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // ── Security headers ──────────────────────────────────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(self), geolocation=(self), microphone=()',
    );
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'",
      ].join('; '),
    );

    // ── Rate limiting ─────────────────────────────────────────────────────
    const ruleIndex = this.rules.findIndex((rule) => rule.match(req));
    if (ruleIndex === -1) return next();

    const rule = this.rules[ruleIndex];
    const key = `${rule.name}:${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (rule.refundOnSuccess) {
      res.on('finish', () => {
        const b = this.buckets.get(key);
        if (!b) return;
        if (res.statusCode < 400) {
          // Refund the attempt taken on entry
          b.count = Math.max(0, b.count - 1);
        }
      });
    }

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > rule.limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      this.logger.warn(`Rate limit (${rule.name}) exceeded for ${req.ip}`);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        statusCode: 429,
        message:
          rule.name === 'auth'
            ? 'Too many failed attempts. Please wait a few minutes and try again.'
            : 'Too many submissions from this address. Please try again shortly.',
        retryAfter,
      });
      return;
    }

    next();
  }

  /** Prune stale buckets so the map doesn't grow unbounded. */
  prune() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
  }
}
