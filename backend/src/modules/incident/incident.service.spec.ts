import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function todayKey(): string {
  return dateKey(new Date());
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

describe('IncidentService', () => {
  let service: IncidentService;
  let prismaMock: {
    incident: { count: jest.Mock; groupBy: jest.Mock };
  };

  const organizationId = 'org-1';

  beforeEach(async () => {
    prismaMock = {
      incident: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        IncidentService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: NotificationsService,
          useValue: {
            sendIncidentAlert: jest.fn(),
            sendAttendanceReport: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IncidentService>(IncidentService);
  });

  describe('getMetrics', () => {
    it('returns total, daily, weekly, open, resolved and byType map', async () => {
      prismaMock.incident.groupBy.mockResolvedValue([
        { incidentType: 'THEFT', _count: { id: 3 } },
        { incidentType: 'FIRE', _count: { id: 2 } },
        { incidentType: 'MEDICAL', _count: { id: 1 } },
      ]);

      const result = await service.getMetrics({ organizationId });

      expect(result.total).toBe(0);
      expect(result.daily).toBe(0);
      expect(result.weekly).toBe(0);
      expect(result.open).toBe(0);
      expect(result.resolved).toBe(0);
      expect(result.byType).toEqual({ THEFT: 3, FIRE: 2, MEDICAL: 1 });
      expect(result.filters).toEqual({
        startDate: null,
        endDate: null,
        type: null,
      });
    });

    it('builds a 7-day time-series when no range is provided', async () => {
      const result = await service.getMetrics({ organizationId });

      expect(result.dailyBreakdown).toHaveLength(7);
      expect(result.dailyBreakdown[6].date).toBe(todayKey());
      for (let i = 1; i < result.dailyBreakdown.length; i++) {
        expect(result.dailyBreakdown[i].date > result.dailyBreakdown[i - 1].date).toBe(true);
      }
    });

    it('builds daily buckets within the requested range', async () => {
      const startDate = daysAgo(3);
      const endDate = daysAgo(1);

      prismaMock.incident.count.mockImplementation(({ where }: any) =>
        Promise.resolve(where.reportedAt ? 1 : 0),
      );

      const result = await service.getMetrics({
        organizationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      expect(result.dailyBreakdown).toHaveLength(3);
      expect(result.dailyBreakdown[0].date).toBe(dateKey(startDate));
      expect(result.dailyBreakdown[2].date).toBe(dateKey(endDate));
      expect(result.dailyBreakdown.every((d: { count: number }) => d.count === 1)).toBe(true);
    });

    it('caps the daily time-series at 31 days', async () => {
      const result = await service.getMetrics({
        organizationId,
        startDate: daysAgo(100).toISOString(),
        endDate: daysAgo(0).toISOString(),
      });

      expect(result.dailyBreakdown).toHaveLength(31);
      expect(result.dailyBreakdown[30].date).toBe(todayKey());
    });

    it('scopes all aggregations to the organization and type filter', async () => {
      await service.getMetrics({ organizationId, type: 'FIRE' });

      const countCalls = prismaMock.incident.count.mock.calls;
      expect(countCalls.length).toBeGreaterThan(0);
      for (const [args] of countCalls) {
        expect(args.where.site).toEqual({ organizationId });
        expect(args.where.incidentType).toBe('FIRE');
      }
      expect(prismaMock.incident.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['incidentType'],
          where: expect.objectContaining({
            incidentType: 'FIRE',
            site: { organizationId },
          }),
        }),
      );
    });

    it('rejects an invalid startDate', async () => {
      await expect(
        service.getMetrics({ organizationId, startDate: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid endDate', async () => {
      await expect(
        service.getMetrics({ organizationId, endDate: 'not-a-date' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a startDate after endDate', async () => {
      await expect(
        service.getMetrics({
          organizationId,
          startDate: '2026-07-10',
          endDate: '2026-07-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('wraps database failures in an InternalServerErrorException', async () => {
      prismaMock.incident.count.mockRejectedValue(
        new Error('db unavailable'),
      );

      await expect(service.getMetrics({ organizationId })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
