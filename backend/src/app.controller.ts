import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Cheap liveness probe — does not touch the database. */
  @Get('health/live')
  live() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness + readiness in one call. Always answers 200 while the process is
   * up, reporting the database in the body.
   *
   * Point Render's health check and any keep-alive ping here. It deliberately
   * does NOT return 5xx when the database is unreachable: a platform health
   * check that fails would restart the service in a loop, which cannot fix a
   * database outage.
   */
  @Get('health')
  async health() {
    const startedAt = Date.now();
    const { database, error } = await this.checkDatabase();

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      database,
      checkedInMs: Date.now() - startedAt,
      version: process.env.npm_package_version ?? 'unknown',
      timestamp: new Date().toISOString(),
      ...(error ? { error } : {}),
    };
  }

  /**
   * Strict readiness probe for external monitoring: 503 when the database is
   * unreachable, so an alert fires without restarting anything.
   */
  @Get('health/ready')
  async ready() {
    const { database, error } = await this.checkDatabase();

    if (database === 'down') {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        database,
        ...(error ? { error } : {}),
        timestamp: new Date().toISOString(),
      });
    }

    return { status: 'ready', database, timestamp: new Date().toISOString() };
  }

  private async checkDatabase(): Promise<{
    database: 'up' | 'down';
    error?: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: 'up' };
    } catch (err) {
      return {
        database: 'down',
        error: (err as Error).message.split('\n')[0],
      };
    }
  }
}
