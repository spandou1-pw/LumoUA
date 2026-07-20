import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { UserGiftInventory } from './entities/user-gift-inventory.entity';

@Injectable()
export class GiftInventoryService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Called from within the same DB transaction as the GiftTransaction
   * insert (GiftsService.send) — takes an EntityManager rather than opening
   * its own transaction, so a gift record and its inventory update can
   * never end up inconsistent with each other (doc GIFTS.md).
   */
  async incrementWithinTransaction(
    manager: EntityManager,
    userId: string,
    giftCatalogItemId: string,
  ): Promise<void> {
    const existing = await manager.findOne(UserGiftInventory, { where: { userId, giftCatalogItemId } });
    if (existing) {
      existing.quantity += 1;
      await manager.save(existing);
      return;
    }
    await manager.save(
      manager.create(UserGiftInventory, {
        userId,
        giftCatalogItemId,
        quantity: 1,
        firstReceivedAt: new Date(),
      }),
    );
  }

  /** doc: "Gift Inventory" — everything a user currently owns, most-recently-received first. */
  async listForUser(userId: string): Promise<UserGiftInventory[]> {
    return this.dataSource
      .getRepository(UserGiftInventory)
      .find({ where: { userId }, order: { lastReceivedAt: 'DESC' } });
  }

  /** doc: "Gift Collection" — a slightly different lens on the same data: grouped, with total distinct items owned (a "completeness" stat), not just a flat received-order list. */
  async collectionSummary(userId: string): Promise<{ distinctItems: number; totalGiftsReceived: number }> {
    const repo = this.dataSource.getRepository(UserGiftInventory);
    const rows = await repo.find({ where: { userId } });
    return {
      distinctItems: rows.length,
      totalGiftsReceived: rows.reduce((sum, r) => sum + r.quantity, 0),
    };
  }

  async getQuantity(userId: string, giftCatalogItemId: string): Promise<number> {
    const row = await this.dataSource
      .getRepository(UserGiftInventory)
      .findOne({ where: { userId, giftCatalogItemId } });
    return row?.quantity ?? 0;
  }
}
