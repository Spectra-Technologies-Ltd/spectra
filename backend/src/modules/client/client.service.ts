import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    billingStatus?: string;
    organizationId: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: query.organizationId };
    if (query.billingStatus) where.billingStatus = query.billingStatus;
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { estateName: { contains: query.search, mode: 'insensitive' } },
        { contactPerson: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sites: { select: { id: true, name: true } } },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;
    const client = await this.prisma.client.findFirst({
      where,
      include: { sites: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(dto: CreateClientDto, organizationId: string) {
    return this.prisma.client.create({
      data: {
        organizationId,
        companyName: dto.companyName,
        estateName: dto.estateName,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        contractStart: new Date(dto.contractStart),
        contractEnd: new Date(dto.contractEnd),
        monthlyFee: dto.monthlyFee,
        numberOfGuardsAllocated: dto.numberOfGuardsAllocated,
        assignedSupervisorId: dto.assignedSupervisorId,
        billingStatus: dto.billingStatus,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateClientDto, organizationId: string) {
    await this.findOne(id, organizationId);
    const data: any = { ...dto };
    if (dto.contractEnd) data.contractEnd = new Date(dto.contractEnd);
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.client.delete({ where: { id } });
  }
}
