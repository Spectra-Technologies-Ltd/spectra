import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

/**
 * NFC badges — the physical half of attendance.
 *
 * Web NFC cannot read a card's UID, so the server issues an opaque token that
 * the browser writes to the blank card as an NDEF text record. Check-in then
 * replays that token, which proves the guard is holding their own badge.
 */
@Injectable()
export class NfcService {
  private readonly logger = new Logger(NfcService.name);

  constructor(private prisma: PrismaService) {}

  /** Issue a card. Optionally bind it to a guard in the same request. */
  async issue(organizationId: string, dto: { guardId?: string; label?: string }) {
    const guard = dto.guardId ? await this.assertGuard(organizationId, dto.guardId) : null;

    const card = await this.prisma.nfcCard.create({
      data: {
        organizationId,
        token: randomUUID(),
        label: dto.label ?? null,
        guardId: guard?.id ?? null,
        status: guard ? 'ACTIVE' : 'UNASSIGNED',
        assignedAt: guard ? new Date() : null,
      },
    });

    this.logger.log(
      `NFC card ${card.id} issued${guard ? ` → ${guard.fullName}` : ' (unassigned)'}`,
    );

    return this.toDto(card, guard?.fullName ?? null);
  }

  /** Bind an existing card to a guard. */
  async assign(organizationId: string, cardId: string, guardId: string) {
    await this.assertCard(organizationId, cardId);
    const guard = await this.assertGuard(organizationId, guardId);

    const updated = await this.prisma.nfcCard.update({
      where: { id: cardId },
      data: { guardId: guard.id, status: 'ACTIVE', assignedAt: new Date() },
    });

    this.logger.log(`NFC card ${cardId} assigned to ${guard.fullName}`);

    return this.toDto(updated, guard.fullName);
  }

  /** Disable a card without deleting its history. */
  async revoke(organizationId: string, cardId: string) {
    await this.assertCard(organizationId, cardId);
    const updated = await this.prisma.nfcCard.update({
      where: { id: cardId },
      data: { status: 'REVOKED' },
    });
    return this.toDto(updated, null);
  }

  /** Remove a card — used when writing to the blank physically failed. */
  async remove(organizationId: string, cardId: string) {
    await this.assertCard(organizationId, cardId);
    await this.prisma.nfcCard.delete({ where: { id: cardId } });
    return { success: true };
  }

  async list(organizationId: string) {
    const cards = await this.prisma.nfcCard.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { guard: { select: { fullName: true } } },
    });
    return cards.map((c) => this.toDto(c, c.guard?.fullName ?? null));
  }

  private async assertCard(organizationId: string, cardId: string) {
    const card = await this.prisma.nfcCard.findFirst({
      where: { id: cardId, organizationId },
    });
    if (!card) throw new NotFoundException(`NFC card ${cardId} not found`);
    return card;
  }

  private async assertGuard(organizationId: string, guardId: string) {
    const guard = await this.prisma.guard.findFirst({
      where: { id: guardId, organizationId },
      select: { id: true, fullName: true },
    });
    if (!guard) throw new NotFoundException(`Guard ${guardId} not found`);
    return guard;
  }

  private toDto(
    card: {
      id: string;
      token: string;
      label: string | null;
      guardId: string | null;
      status: string;
      assignedAt: Date | null;
      createdAt: Date;
    },
    guardName: string | null,
  ) {
    return {
      id: card.id,
      token: card.token,
      label: card.label,
      guardId: card.guardId,
      guardName,
      status: card.status,
      assignedAt: card.assignedAt,
      createdAt: card.createdAt,
    };
  }
}
