import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  async attachGuardPhoto(guardId: string, filename: string, organizationId: string) {
    const guard = await this.prisma.guard.findFirst({
      where: { id: guardId, organizationId },
    });
    if (!guard) throw new NotFoundException('Guard not found');

    return this.prisma.guard.update({
      where: { id: guardId },
      data: { photoUrl: `/uploads/${filename}` },
    });
  }
}
