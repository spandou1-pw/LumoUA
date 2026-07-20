import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { GiftsService } from '../../src/modules/gifts/gifts.service';
import { GiftCatalogItem } from '../../src/modules/gifts/entities/gift-catalog-item.entity';
import { GiftTransaction } from '../../src/modules/gifts/entities/gift-transaction.entity';
import { WalletService } from '../../src/modules/wallet/wallet.service';
import { PolicyService } from '../../src/modules/users/policy.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { GiftInventoryService } from '../../src/modules/gifts/gift-inventory.service';

describe('GiftsService — availability & limited-supply atomicity', () => {
  let service: GiftsService;
  let catalogRepo: { findOne: jest.Mock; createQueryBuilder: jest.Mock };
  let giftTxRepo: { create: jest.Mock };
  let wallet: { debit: jest.Mock; applyLedgerMutation: jest.Mock };
  let policy: { isBlockedEitherWay: jest.Mock };
  let notifications: { notify: jest.Mock };
  let inventory: { incrementWithinTransaction: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let updateExecute: jest.Mock;

  const baseItem = (overrides: Partial<GiftCatalogItem> = {}): GiftCatalogItem =>
    ({
      id: 'item-1',
      name: 'Rose',
      coinCost: '100',
      active: true,
      availableFrom: null,
      availableUntil: null,
      totalSupply: null,
      remainingSupply: null,
      ...overrides,
    }) as GiftCatalogItem;

  beforeEach(async () => {
    updateExecute = jest.fn();
    catalogRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: updateExecute,
      })),
    };
    giftTxRepo = { create: jest.fn((x) => x) };
    wallet = { debit: jest.fn(), applyLedgerMutation: jest.fn() };
    policy = { isBlockedEitherWay: jest.fn().mockResolvedValue(false) };
    notifications = { notify: jest.fn() };
    inventory = { incrementWithinTransaction: jest.fn() };
    dataSource = {
      transaction: jest.fn(async (cb) =>
        cb({ save: jest.fn((x) => ({ id: 'gift-tx-1', ...x })), create: jest.fn((_e, x) => x) }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftsService,
        { provide: getRepositoryToken(GiftCatalogItem), useValue: catalogRepo },
        { provide: getRepositoryToken(GiftTransaction), useValue: giftTxRepo },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: WalletService, useValue: wallet },
        { provide: PolicyService, useValue: policy },
        { provide: NotificationsService, useValue: notifications },
        { provide: GiftInventoryService, useValue: inventory },
      ],
    }).compile();

    service = module.get(GiftsService);
  });

  it('rejects gifting yourself', async () => {
    await expect(
      service.send('user-1', { recipientId: 'user-1', giftCatalogItemId: 'item-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when sender and recipient have blocked each other', async () => {
    policy.isBlockedEitherWay.mockResolvedValue(true);
    catalogRepo.findOne.mockResolvedValue(baseItem());

    await expect(
      service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'item-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NOT_FOUND for a missing or inactive catalog item', async () => {
    catalogRepo.findOne.mockResolvedValue(null);

    await expect(
      service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a gift whose availability window has not started yet', async () => {
    const future = new Date(Date.now() + 86_400_000);
    catalogRepo.findOne.mockResolvedValue(baseItem({ availableFrom: future }));

    await expect(
      service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'item-1' }),
    ).rejects.toThrow(ForbiddenException);
    expect(wallet.debit).not.toHaveBeenCalled();
  });

  it('rejects a gift whose availability window has already ended', async () => {
    const past = new Date(Date.now() - 86_400_000);
    catalogRepo.findOne.mockResolvedValue(baseItem({ availableUntil: past }));

    await expect(
      service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'item-1' }),
    ).rejects.toThrow(ForbiddenException);
    expect(wallet.debit).not.toHaveBeenCalled();
  });

  it('rejects a sold-out limited gift via the atomic conditional decrement (affected=0), without debiting the wallet', async () => {
    catalogRepo.findOne.mockResolvedValue(baseItem({ totalSupply: '10', remainingSupply: '0' }));
    updateExecute.mockResolvedValue({ affected: 0 });

    await expect(
      service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'item-1' }),
    ).rejects.toThrow(ConflictException);
    expect(wallet.debit).not.toHaveBeenCalled();
  });

  it('succeeds for a limited gift with remaining stock — decrements supply, debits wallet, updates inventory', async () => {
    catalogRepo.findOne.mockResolvedValue(baseItem({ totalSupply: '10', remainingSupply: '3' }));
    updateExecute.mockResolvedValue({ affected: 1 });

    const result = await service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'item-1' });

    expect(wallet.debit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', amount: 100n, type: 'gift_sent' }),
    );
    expect(inventory.incrementWithinTransaction).toHaveBeenCalledWith(expect.anything(), 'user-2', 'item-1');
    expect(wallet.applyLedgerMutation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-2', amount: 0n, type: 'gift_received_notional' }),
    );
    expect(notifications.notify).toHaveBeenCalled();
    expect(result.id).toBe('gift-tx-1');
  });

  it('never touches remaining_supply for an unlimited (totalSupply=null) gift', async () => {
    catalogRepo.findOne.mockResolvedValue(baseItem()); // totalSupply: null
    await service.send('user-1', { recipientId: 'user-2', giftCatalogItemId: 'item-1' });

    expect(catalogRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(wallet.debit).toHaveBeenCalled();
  });
});
