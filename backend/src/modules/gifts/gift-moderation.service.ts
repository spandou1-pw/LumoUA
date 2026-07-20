import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftTransaction } from './entities/gift-transaction.entity';
import { AdminAuditLog } from '../admin/entities/admin-audit-log.entity';

/**
 * doc GIFTS.md: deliberately narrow scope — this hides a gift's public
 * visibility (e.g. an abusive attached message), it does NOT reverse coins
 * or delete the underlying record (that's RefundsService's job, Stage 6,
 * a distinct action with distinct consequences). Every action is
 * audit-logged (doc 24 NFR-SEC-4), same as every other admin action in
 * this codebase.
 */
@Injectable()
export class GiftModerationService {
  constructor(
    @InjectRepository(GiftTransaction) private readonly giftTransactions: Repository<GiftTransaction>,
    @InjectRepository(AdminAuditLog) private readonly auditLog: Repository<AdminAuditLog>,
  ) {}

  async hide(giftTransactionId: string, adminActorId: string, reason: string): Promise<GiftTransaction> {
    const gift = await this.giftTransactions.findOne({ where: { id: giftTransactionId } });
    if (!gift) throw new NotFoundException('GIFT_TRANSACTION_NOT_FOUND');

    gift.hidden = true;
    gift.hiddenReason = reason;
    const saved = await this.giftTransactions.save(gift);

    await this.auditLog.insert({
      actorId: adminActorId,
      action: 'GIFT_HIDDEN',
      targetType: 'gift_transaction',
      targetId: gift.id,
      metadata: { reason },
    });

    return saved;
  }

  async unhide(giftTransactionId: string, adminActorId: string): Promise<GiftTransaction> {
    const gift = await this.giftTransactions.findOne({ where: { id: giftTransactionId } });
    if (!gift) throw new NotFoundException('GIFT_TRANSACTION_NOT_FOUND');

    gift.hidden = false;
    gift.hiddenReason = null;
    const saved = await this.giftTransactions.save(gift);

    await this.auditLog.insert({
      actorId: adminActorId,
      action: 'GIFT_UNHIDDEN',
      targetType: 'gift_transaction',
      targetId: gift.id,
    });

    return saved;
  }

  async listHidden(limit = 50): Promise<GiftTransaction[]> {
    return this.giftTransactions.find({ where: { hidden: true }, order: { createdAt: 'DESC' }, take: limit });
  }
}
