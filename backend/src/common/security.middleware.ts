import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Zero-dependency hardening:
 * 1. Security headers (CSP, frame protection, MIME sniffing, referrer).
 * 2. Sliding-window rate limiting for auth endpoints (login/register/tfa)
 *    to blunt credential stuffing and brute force.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private buckets = new Map<string, Bucket>();

  // Auth routes are limited per IP: 10 attempts / 15 min window
  private readonly AUTH_LIMIT = 10;
  private readonly AUTH_WINDOW_MS = 15 * 60 * 1000;

  // Public badge routes (no session) are limited per IP: 120 / 15 min.
  // Generous because a shared site device may serve every guard on shift.
  private readonly BADGE_LIMIT = 120;
  private readonly BADGE_WINDOW_MS = 15 * 60 * 1000;

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

    // ── Rate limiting (auth + public badge endpoints) ────────────────────
    // Auth: only FAILED attempts consume budget — a successful login refunds
    // the attempt so legit users are not locked out by quick retries. Badge:
    // the endpoints are public, so every request counts.
    const isAuthRoute = /^\/api\/v1\/auth\/(login|register|tfa)/.test(req.path);
    const isBadgeRoute = /^\/api\/v1\/badge\//.test(req.path);
    if (!isAuthRoute && !isBadgeRoute) return next();

    const key = isBadgeRoute ? `${req.ip}:badge` : `${req.ip}:${req.path}`;
    const limit = isBadgeRoute ? this.BADGE_LIMIT : this.AUTH_LIMIT;
    const windowMs = isBadgeRoute ? this.BADGE_WINDOW_MS : this.AUTH_WINDOW_MS;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (isAuthRoute) {
      res.on('finish', () => {
        const b = this.buckets.get(key);
        if (!b) return;
        if (res.statusCode < 400) {
          // Success — refund the attempt taken on entry
          b.count = Math.max(0, b.count - 1);
        }
      });
    }

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      res.status(429).json({
        statusCode: 429,
        message: 'Too many failed attempts. Please wait a few minutes and try again.',
        retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
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
