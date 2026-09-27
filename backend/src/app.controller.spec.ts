import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaMock: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('reports ok and database up when the query succeeds', async () => {
      const result = await appController.health();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('up');
      expect(result.error).toBeUndefined();
      expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it('answers 200-equivalent payload with degraded when the database is unreachable', async () => {
      prismaMock.$queryRaw.mockRejectedValue(
        new Error("Can't reach database server at localhost:5434"),
      );

      // The liveness probe must not throw — a failing platform health check
      // would restart the service in a loop.
      const result = await appController.health();

      expect(result.status).toBe('degraded');
      expect(result.database).toBe('down');
      expect(result.error).toContain('database server');
    });
  });

  describe('health/ready', () => {
    it('returns ready when the database responds', async () => {
      await expect(appController.ready()).resolves.toMatchObject({
        status: 'ready',
        database: 'up',
      });
    });

    it('throws 503 when the database is unreachable', async () => {
      prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));

      await expect(appController.ready()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('health/live', () => {
    it('does not touch the database', () => {
      const result = appController.live();

      expect(result.status).toBe('ok');
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
