import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../database/prisma.service';

interface CreateArgs {
  data: Record<string, unknown>;
}
interface FindManyArgs {
  where: Record<string, unknown>;
  take: number;
  skip: number;
}
interface UpdateArgs {
  where: { id: string };
  data: Record<string, unknown>;
}
interface WhereArgs {
  where: Record<string, unknown>;
}
interface IdArgs {
  where: { id: string };
}

/**
 * Arguments recorded by the mock, so assertions read as plain typed values
 * instead of reaching through `mock.calls` (which resolves to `any`).
 */
interface RecordedCalls {
  findFirst: WhereArgs[];
  create: CreateArgs[];
  findMany: FindManyArgs[];
  count: Array<{ where?: Record<string, unknown> } | undefined>;
  findUnique: IdArgs[];
  update: UpdateArgs[];
  delete: IdArgs[];
  groupBy: unknown[];
}

/**
 * Values the mock hands back. Kept separate from `jest.mockResolvedValueOnce`
 * because the `…Once` helpers bypass the implementation entirely — which would
 * skip the call recording these assertions depend on.
 */
interface MockResults {
  findFirst: unknown;
  findUnique: unknown;
  countQueue: number[];
  groupByQueue: unknown[][];
}

/**
 * Fresh, fully typed mocks per test — no shared `jest.fn()` state to leak
 * between cases.
 */
function buildPrismaMock() {
  const calls: RecordedCalls = {
    findFirst: [],
    create: [],
    findMany: [],
    count: [],
    findUnique: [],
    update: [],
    delete: [],
    groupBy: [],
  };

  const results: MockResults = {
    findFirst: null,
    findUnique: null,
    countQueue: [],
    groupByQueue: [],
  };

  const lead = {
    findFirst: jest.fn((args: WhereArgs) => {
      calls.findFirst.push(args);
      return Promise.resolve(results.findFirst);
    }),
    create: jest.fn((args: CreateArgs) => {
      calls.create.push(args);
      return Promise.resolve<unknown>({ id: 'new-lead', ...args.data });
    }),
    findMany: jest.fn((args: FindManyArgs) => {
      calls.findMany.push(args);
      return Promise.resolve<unknown[]>([]);
    }),
    count: jest.fn((args?: { where?: Record<string, unknown> }) => {
      calls.count.push(args);
      return Promise.resolve(results.countQueue.shift() ?? 0);
    }),
    findUnique: jest.fn((args: IdArgs) => {
      calls.findUnique.push(args);
      return Promise.resolve(results.findUnique);
    }),
    update: jest.fn((args: UpdateArgs) => {
      calls.update.push(args);
      return Promise.resolve<unknown>({ id: args.where.id, ...args.data });
    }),
    delete: jest.fn((args: IdArgs) => {
      calls.delete.push(args);
      return Promise.resolve<unknown>({ id: 'deleted' });
    }),
    groupBy: jest.fn((args: unknown) => {
      calls.groupBy.push(args);
      return Promise.resolve(results.groupByQueue.shift() ?? []);
    }),
  };

  return {
    lead,
    calls,
    results,
    // Mirrors Prisma's array form: resolve the given operation promises.
    $transaction: jest.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
  };
}

type PrismaMock = ReturnType<typeof buildPrismaMock>;

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  describe('create', () => {
    it('normalises the email and records verbatim payload plus meta', async () => {
      await service.create(
        {
          kind: 'CONTACT',
          email: '  Ada@Example.COM ',
          firstName: 'Ada',
          subject: 'Partnership',
          message: 'Hello there',
        },
        { ip: '1.2.3.4', userAgent: 'jest' },
      );

      const data = prisma.calls.create.at(-1)!.data;
      expect(data.email).toBe('ada@example.com');
      expect(data.status).toBe('NEW');
      expect(data.source).toBe('landing:contact');
      expect(data.ipAddress).toBe('1.2.3.4');
      expect(data.organization).toBeUndefined();
      expect(JSON.parse(String(data.payload))).toMatchObject({
        subject: 'Partnership',
        kind: 'CONTACT',
      });
    });

    it('maps organizationName to organization and honours an explicit source', async () => {
      await service.create({
        kind: 'DEMO',
        email: 'grace@acme.ng',
        organizationName: 'Acme Estates',
        source: 'landing:demo-form',
      });

      const data = prisma.calls.create.at(-1)!.data;
      expect(data.organization).toBe('Acme Estates');
      expect(data.source).toBe('landing:demo-form');
    });

    it('is idempotent for newsletter signups', async () => {
      prisma.results.findFirst = { id: 'lead-news', kind: 'NEWSLETTER' };

      const result = await service.create({
        kind: 'NEWSLETTER',
        email: 'a@b.com',
      });

      expect(prisma.calls.findFirst.at(-1)).toEqual({
        where: { email: 'a@b.com', kind: 'NEWSLETTER' },
      });
      expect(prisma.lead.create).not.toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'lead-news', duplicate: true });
    });

    it('still creates a contact lead when the address is already subscribed', async () => {
      await service.create({
        kind: 'CONTACT',
        email: 'a@b.com',
        message: 'A distinct enquiry',
      });

      // The newsletter dedupe check must not run for other kinds.
      expect(prisma.lead.findFirst).not.toHaveBeenCalled();
      expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('clamps the page size and reports paging metadata', async () => {
      prisma.results.countQueue.push(42);

      const result = await service.findAll({ page: '2', limit: '5000' });

      const args = prisma.calls.findMany.at(-1)!;
      expect(args.take).toBe(100); // MAX_LIMIT
      expect(args.skip).toBe(100); // (2 - 1) * 100
      expect(result.meta).toEqual({ total: 42, page: 2, limit: 100, pages: 1 });
    });

    it('applies an insensitive search across the useful columns', async () => {
      await service.findAll({ search: 'acme' });

      const where = prisma.calls.findMany.at(-1)!.where;
      expect(where.OR).toHaveLength(5);
      expect((where.OR as unknown[])[0]).toEqual({
        email: { contains: 'acme', mode: 'insensitive' },
      });
    });

    it('filters by kind and status when supplied', async () => {
      await service.findAll({ kind: 'DEMO', status: 'NEW' });

      const where = prisma.calls.findMany.at(-1)!.where;
      expect(where).toMatchObject({ kind: 'DEMO', status: 'NEW' });
    });

    it('treats a nonsense page number as page 1', async () => {
      await service.findAll({ page: 'not-a-number' });

      expect(prisma.calls.findMany.at(-1)!.skip).toBe(0);
    });
  });

  describe('getStats', () => {
    it('maps grouped counts into lookup objects', async () => {
      prisma.results.groupByQueue.push(
        [
          { kind: 'CONTACT', _count: { _all: 3 } },
          { kind: 'DEMO', _count: { _all: 2 } },
        ],
        [{ status: 'NEW', _count: { _all: 5 } }],
      );
      prisma.results.countQueue.push(5, 4);

      const result = await service.getStats();

      expect(result.total).toBe(5);
      expect(result.last7Days).toBe(4);
      expect(result.byKind).toEqual({ CONTACT: 3, DEMO: 2 });
      expect(result.byStatus).toEqual({ NEW: 5 });
    });
  });

  describe('findOne', () => {
    it('throws NotFound for an unknown id', async () => {
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('stamps the handler when the status changes', async () => {
      prisma.results.findUnique = { id: 'lead-1' };

      await service.update('lead-1', { status: 'CONTACTED' }, 'user-9');

      const data = prisma.calls.update.at(-1)!.data;
      expect(data.status).toBe('CONTACTED');
      expect(data.handledById).toBe('user-9');
      expect(data.handledAt).toBeInstanceOf(Date);
    });

    it('leaves the handler untouched when only notes change', async () => {
      prisma.results.findUnique = { id: 'lead-1' };

      await service.update('lead-1', { notes: 'Called, no answer' }, 'user-9');

      const data = prisma.calls.update.at(-1)!.data;
      expect(data.notes).toBe('Called, no answer');
      expect(data.handledById).toBeUndefined();
      expect(data.handledAt).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('refuses to delete a lead that does not exist', async () => {
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.lead.delete).not.toHaveBeenCalled();
    });
  });
});
