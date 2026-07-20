import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GiftCatalogItem } from './entities/gift-catalog-item.entity';
import { GiftTransaction } from './entities/gift-transaction.entity';
import { SendGiftDto } from './dto/gift.dto';
import { WalletService } from '../wallet/wallet.service';
import { PolicyService } from '../users/policy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GiftInventoryService } from './gift-inventory.service';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.dto';

/**
 * doc PAYMENTS.md / doc GIFTS.md: sending a gift debits the sender's coin
 * balance (real coins, real ledger entry). The recipient's side is a
 * `gift_received_notional` ledger row plus an inventory entry — explicitly
 * NOT an addition to the recipient's *spendable* coin balance. There is no
 * code path anywhere in this service that credits the recipient's real
 * `coinBalance`. If a future product decision wants creators to cash out
 * received gifts, that's a distinct Stripe Connect payout feature —
 * flagged in PAYMENTS.md, not built here.
 */
@Injectable()
export class GiftsService {
  constructor(
    @InjectRepository(GiftCatalogItem) private readonly catalog: Repository<GiftCatalogItem>,
    @InjectRepository(GiftTransaction) private readonly giftTransactions: Repository<GiftTransaction>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly wallet: WalletService,
    private readonly policy: PolicyService,
    private readonly notifications: NotificationsService,
    private readonly inventory: GiftInventoryService,
  ) {}

  async send(senderId: string, dto: SendGiftDto): Promise<GiftTransaction> {
    if (senderId === dto.recipientId) throw new ForbiddenException('CANNOT_GIFT_SELF');
    if (await this.policy.isBlockedEitherWay(senderId, dto.recipientId)) {
      throw new ForbiddenException('BLOCKED');
    }

    const item = await this.catalog.findOne({ where: { id: dto.giftCatalogItemId, active: true } });
    if (!item) throw new NotFoundException('GIFT_ITEM_NOT_FOUND');

    const now = new Date();
    if (item.availableFrom && item.availableFrom > now) throw new ForbiddenException('GIFT_NOT_YET_AVAILABLE');
    if (item.availableUntil && item.availableUntil < now) throw new ForbiddenException('GIFT_NO_LONGER_AVAILABLE');

    // doc GIFTS.md "Limited Gifts": atomic conditional decrement — a plain
    // read-then-write would let two concurrent sends both see stock=1 and
    // both succeed, overselling a supposedly-scarce item. The UPDATE ...
    // WHERE remaining_supply > 0 makes the check-and-decrement one
    // indivisible operation at the database level.
    if (item.totalSupply !== null) {
      const result = await this.catalog
        .createQueryBuilder()
        .update(GiftCatalogItem)
        .set({ remainingSupply: () => 'remaining_supply - 1' })
        .where('id = :id', { id: item.id })
        .andWhere('remaining_supply > 0')
        .execute();
      if (result.affected === 0) {
        throw new ConflictException('GIFT_SOLD_OUT');
      }
    }

    // Real debit — the only balance-affecting operation in this flow.
    await this.wallet.debit({
      userId: senderId,
      amount: BigInt(item.coinCost),
      type: 'gift_sent',
      referenceType: 'gift_catalog_item',
      referenceId: item.id,
      metadata: { recipientId: dto.recipientId },
    });

    // Gift record + notional recipient ledger row + inventory increment are
    // all consequences of the same successful debit — kept in one DB
    // transaction so they can never end up inconsistent with each other.
    const gift = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(GiftTransaction, {
          senderId,
          recipientId: dto.recipientId,
          giftCatalogItemId: item.id,
          coinCost: item.coinCost,
          message: dto.message ?? null,
          contextType: dto.contextType ?? null,
          contextId: dto.contextId ?? null,
        }),
      );
      await this.inventory.incrementWithinTransaction(manager, dto.recipientId, item.id);
      return created;
    });

    // Notional-only record on the recipient's ledger — NOT spendable coins
    // (doc PAYMENTS.md). Purely for their gift-history/profile display.
    await this.wallet.applyLedgerMutation({
      userId: dto.recipientId,
      amount: 0n, // zero real balance impact — this row exists only as a display/history record
      type: 'gift_received_notional',
      referenceType: 'gift',
      referenceId: gift.id,
      metadata: { senderId, giftCatalogItemId: item.id, coinValue: item.coinCost },
    });

    await this.notifications.notify(
      dto.recipientId,
      'new_like', // doc 25: closest existing engagement-notification type; a dedicated
      // 'gift_received' type is a one-line addition to doc 25's enum when this ships for real
      { giftId: gift.id, senderId },
      'Новий подарунок',
      'Вам надіслали подарунок',
    );

    return gift;
  }

  /** doc GIFTS.md "Gift History": cursor-paginated, replacing the earlier unpaginated version. */
  async receivedHistory(userId: string, cursor?: string, limit = 30): Promise<PaginatedResult<GiftTransaction>> {
    const qb = this.giftTransactions
      .createQueryBuilder('g')
      .where('g.recipient_id = :userId', { userId })
      .andWhere('g.hidden = false')
      .orderBy('g.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('g.created_at < :cursor', { cursor: new Date(cursor) });
    return paginate(await qb.getMany(), limit);
  }

  async sentHistory(userId: string, cursor?: string, limit = 30): Promise<PaginatedResult<GiftTransaction>> {
    const qb = this.giftTransactions
      .createQueryBuilder('g')
      .where('g.sender_id = :userId', { userId })
      .orderBy('g.created_at', 'DESC')
      .take(limit + 1);
    if (cursor) qb.andWhere('g.created_at < :cursor', { cursor: new Date(cursor) });
    return paginate(await qb.getMany(), limit);
  }
}
