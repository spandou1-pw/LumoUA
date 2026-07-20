import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WalletService } from '../../src/modules/wallet/wallet.service';
import { Wallet } from '../../src/modules/wallet/entities/wallet.entity';

describe('WalletService.transferBetweenWallets — atomicity', () => {
  let service: WalletService;
  let wallets: Map<string, Wallet>;
  let fakeManager: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    wallets = new Map();

    fakeManager = {
      findOne: jest.fn(async (entity, opts) => {
        if (entity === Wallet) return wallets.get(opts.where.userId) ?? null;
        return null;
      }),
      save: jest.fn(async (entityOrInstance) => {
        if ('coinBalance' in entityOrInstance) {
          wallets.set(entityOrInstance.userId, entityOrInstance);
        }
        return entityOrInstance;
      }),
      create: jest.fn((_entity, data) => ({ ...data })),
    };

    dataSource = { transaction: jest.fn(async (cb) => cb(fakeManager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: getDataSourceToken(), useValue: dataSource }],
    }).compile();

    service = module.get(WalletService);

    wallets.set('sender-1', { userId: 'sender-1', coinBalance: '1000', version: 1 } as Wallet);
    wallets.set('recipient-1', { userId: 'recipient-1', coinBalance: '200', version: 1 } as Wallet);
  });

  it('moves the exact amount from sender to recipient in one transaction', async () => {
    const result = await service.transferBetweenWallets({
      senderId: 'sender-1',
      recipientId: 'recipient-1',
      amount: 300n,
      referenceId: 'transfer-1',
    });

    expect(wallets.get('sender-1')?.coinBalance).toBe('700');
    expect(wallets.get('recipient-1')?.coinBalance).toBe('500');
    expect(result.senderEntry.amount).toBe('-300');
    expect(result.senderEntry.type).toBe('transfer_sent');
    expect(result.recipientEntry.amount).toBe('300');
    expect(result.recipientEntry.type).toBe('transfer_received');
  });

  it('rejects a transfer exceeding the sender balance, leaving both wallets untouched', async () => {
    await expect(
      service.transferBetweenWallets({
        senderId: 'sender-1',
        recipientId: 'recipient-1',
        amount: 5000n,
        referenceId: 'transfer-2',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(wallets.get('sender-1')?.coinBalance).toBe('1000'); // unchanged
    expect(wallets.get('recipient-1')?.coinBalance).toBe('200'); // unchanged — no partial credit
  });

  it('rejects a zero or negative transfer amount', async () => {
    await expect(
      service.transferBetweenWallets({ senderId: 'sender-1', recipientId: 'recipient-1', amount: 0n, referenceId: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a wallet on the fly for a recipient who has never had one', async () => {
    const result = await service.transferBetweenWallets({
      senderId: 'sender-1',
      recipientId: 'brand-new-user',
      amount: 100n,
      referenceId: 'transfer-3',
    });

    expect(result.recipientEntry.balanceAfter).toBe('100');
    expect(wallets.get('brand-new-user')?.coinBalance).toBe('100');
  });
});
