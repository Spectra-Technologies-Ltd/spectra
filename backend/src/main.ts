import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env before anything else (__dirname is dist/src/, go up 2 levels to backend root)
config({ path: resolve(__dirname, '..', '..', '.env'), override: true });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { SecurityMiddleware } from './common/security.middleware';
import type { Request, Response, NextFunction } from 'express';

/**
 * Read a `.stack` string off a JSON error body without assuming its shape.
 */
function errorStack(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'stack' in body) {
    const stack: unknown = body.stack;
    return typeof stack === 'string' ? stack : undefined;
  }
  return undefined;
}

async function bootstrap() {
  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Behind a platform proxy (Render, Vercel, nginx) the socket address is the
  // proxy. Trust the first hop so req.ip — used for rate limiting and lead
  // attribution — is the real client address.
  app.set('trust proxy', 1);

  app.use(cookieParser());

  // Security hardening: headers + auth rate limiting
  const security = new SecurityMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) =>
    security.use(req, res, next),
  );
  setInterval(() => security.prune(), 60 * 1000).unref();

  // Log all requests with full error details
  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalJson = res.json.bind(res);
    let responseBody: unknown = null;

    // Intercept JSON responses to capture error details
    res.json = (body: unknown) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      const { statusCode } = res;
      const ms = Date.now() - start;
      const details =
        statusCode >= 400 && responseBody
          ? ` | ${JSON.stringify(responseBody).substring(0, 200)}`
          : '';

      if (statusCode >= 500) {
        httpLogger.error(
          `${req.method} ${req.originalUrl} → ${statusCode} (${ms}ms)${details}`,
          statusCode >= 500 ? errorStack(responseBody) : undefined,
        );
      } else if (statusCode >= 400) {
        httpLogger.warn(
          `${req.method} ${req.originalUrl} → ${statusCode} (${ms}ms)${details}`,
        );
      } else {
        httpLogger.log(
          `${req.method} ${req.originalUrl} → ${statusCode} (${ms}ms)`,
        );
      }
    });
    next();
  });

  // Serve uploaded media files statically
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ??
      false,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
