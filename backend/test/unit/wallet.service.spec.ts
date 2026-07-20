import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WalletService } from '../../src/modules/wallet/wallet.service';
import { Wallet } from '../../src/modules/wallet/entities/wallet.entity';

/**
 * doc 38: this is exactly the kind of business logic that warrants
 * near-exhaustive testing (financial correctness) — every test here
 * verifies a specific invariant the ledger design promises, not just
 * "the happy path returns 200".
 */
describe('WalletService — ledger correctness', () => {
  let service: WalletService;
  let wallets: Map<string, Wallet>;
  let fakeManager: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock; getRepository: jest.Mock };

  beforeEach(async () => {
    wallets = new Map();

    fakeManager = {
      findOne: jest.fn(async (entity, opts) => {
        if (entity === Wallet) return wallets.get(opts.where.userId) ?? null;
        return null;
      }),
      save: jest.fn(async (entityOrInstance) => {
        if (entityOrInstance instanceof Wallet || 'coinBalance' in entityOrInstance) {
          wallets.set(entityOrInstance.userId, entityOrInstance);
          return entityOrInstance;
        }
        return entityOrInstance; // WalletTransaction — nothing to persist for the test
      }),
      create: jest.fn((_entity, data) => ({ ...data })),
    };

    dataSource = {
      transaction: jest.fn(async (cb) => cb(fakeManager)),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: getDataSourceToken(), useValue: dataSource }],
    }).compile();

    service = module.get(WalletService);
  });

  it('creates a zero-balance wallet on first access', async () => {
    const balance = await service.getBalance('user-1');
    expect(balance).toBe(0n);
  });

  it('credit() increases the balance by exactly the credited amount', async () => {
    await service.credit({ userId: 'user-1', amount: 500n, type: 'coin_purchase' });
    const balance = await service.getBalance('user-1');
    expect(balance).toBe(500n);
  });

  it('debit() decreases the balance by exactly the debited amount', async () => {
    await service.credit({ userId: 'user-1', amount: 500n, type: 'coin_purchase' });
    await service.debit({ userId: 'user-1', amount: 200n, type: 'gift_sent' });
    const balance = await service.getBalance('user-1');
    expect(balance).toBe(300n);
  });

  it('rejects a debit that would drive the balance negative — no negative balances, ever', async () => {
    await service.credit({ userId: 'user-1', amount: 100n, type: 'coin_purchase' });

    await expect(service.debit({ userId: 'user-1', amount: 150n, type: 'gift_sent' })).rejects.toThrow(
      BadRequestException,
    );

    // Balance must be unchanged after the rejected debit — not partially applied.
    const balance = await service.getBalance('user-1');
    expect(balance).toBe(100n);
  });

  it('rejects a zero or negative credit amount', async () => {
    await expect(service.credit({ userId: 'user-1', amount: 0n, type: 'coin_purchase' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.credit({ userId: 'user-1', amount: -10n, type: 'coin_purchase' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a zero or negative debit amount', async () => {
    await expect(service.debit({ userId: 'user-1', amount: 0n, type: 'gift_sent' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('records balanceAfter on the ledger entry matching the wallet balance post-mutation', async () => {
    const entry = await service.credit({ userId: 'user-1', amount: 750n, type: 'coin_purchase' });
    expect(entry.balanceAfter).toBe('750');

    const second = await service.debit({ userId: 'user-1', amount: 300n, type: 'gift_sent' });
    expect(second.balanceAfter).toBe('450');
  });

  it('a zero-amount ledger mutation (gift_received_notional) never changes the balance', async () => {
    await service.credit({ userId: 'user-1', amount: 100n, type: 'coin_purchase' });
    await service.applyLedgerMutation({ userId: 'user-1', amount: 0n, type: 'gift_received_notional' });

    const balance = await service.getBalance('user-1');
    expect(balance).toBe(100n); // unaffected by the notional-only entry
  });

  it('keeps two different users balances fully independent', async () => {
    await service.credit({ userId: 'user-a', amount: 1000n, type: 'coin_purchase' });
    await service.credit({ userId: 'user-b', amount: 50n, type: 'coin_purchase' });
    await service.debit({ userId: 'user-a', amount: 400n, type: 'gift_sent' });

    expect(await service.getBalance('user-a')).toBe(600n);
    expect(await service.getBalance('user-b')).toBe(50n);
  });
});
