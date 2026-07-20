import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CoinTransferService } from '../../src/modules/wallet/coin-transfer.service';
import { CoinTransfer } from '../../src/modules/wallet/entities/coin-transfer.entity';
import { WalletService } from '../../src/modules/wallet/wallet.service';
import { WalletSecurityService } from '../../src/modules/wallet/wallet-security.service';
import { WalletFraudService } from '../../src/modules/wallet/wallet-fraud.service';
import { PolicyService } from '../../src/modules/users/policy.service';
import { PremiumLimitsService } from '../../src/modules/premium/premium-limits.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';

describe('CoinTransferService', () => {
  let service: CoinTransferService;
  let transfersRepo: { save: jest.Mock; create: jest.Mock };
  let wallet: { transferBetweenWallets: jest.Mock };
  let security: { assertNotLocked: jest.Mock };
  let fraud: { assertTransferVelocityOk: jest.Mock; checkStructuringPattern: jest.Mock };
  let policy: { isBlockedEitherWay: jest.Mock };
  let limits: { limitsFor: jest.Mock };
  let notifications: { notify: jest.Mock };
  let cache: Map<string, unknown>;

  beforeEach(async () => {
    transfersRepo = { save: jest.fn((x) => x), create: jest.fn((x) => x) };
    wallet = { transferBetweenWallets: jest.fn() };
    security = { assertNotLocked: jest.fn() };
    fraud = {
      assertTransferVelocityOk: jest.fn(),
      checkStructuringPattern: jest.fn().mockResolvedValue({ suspicious: false, distinctRecipients: 1 }),
    };
    policy = { isBlockedEitherWay: jest.fn().mockResolvedValue(false) };
    limits = { limitsFor: jest.fn().mockResolvedValue({ dailyCoinTransferLimit: 5000 }) };
    notifications = { notify: jest.fn() };
    cache = new Map();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinTransferService,
        { provide: getRepositoryToken(CoinTransfer), useValue: transfersRepo },
        { provide: WalletService, useValue: wallet },
        { provide: WalletSecurityService, useValue: security },
        { provide: WalletFraudService, useValue: fraud },
        { provide: PolicyService, useValue: policy },
        { provide: PremiumLimitsService, useValue: limits },
        { provide: NotificationsService, useValue: notifications },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn((key: string) => Promise.resolve(cache.get(key))),
            set: jest.fn((key: string, value: unknown) => {
              cache.set(key, value);
              return Promise.resolve();
            }),
          },
        },
      ],
    }).compile();

    service = module.get(CoinTransferService);
  });

  it('rejects transferring to yourself', async () => {
    await expect(service.transfer('user-1', 'user-1', 100n)).rejects.toThrow(ForbiddenException);
    expect(wallet.transferBetweenWallets).not.toHaveBeenCalled();
  });

  it('rejects a transfer between users who have blocked each other', async () => {
    policy.isBlockedEitherWay.mockResolvedValue(true);

    await expect(service.transfer('user-1', 'user-2', 100n)).rejects.toThrow(ForbiddenException);
    expect(wallet.transferBetweenWallets).not.toHaveBeenCalled();
  });

  it("rejects a transfer if either party's wallet is locked", async () => {
    security.assertNotLocked.mockImplementationOnce(async () => {
      throw new ForbiddenException('WALLET_LOCKED');
    });

    await expect(service.transfer('user-1', 'user-2', 100n)).rejects.toThrow(ForbiddenException);
    expect(wallet.transferBetweenWallets).not.toHaveBeenCalled();
  });

  it('rejects a transfer that would exceed the daily limit', async () => {
    limits.limitsFor.mockResolvedValue({ dailyCoinTransferLimit: 500 });

    await expect(service.transfer('user-1', 'user-2', 600n)).rejects.toThrow(ForbiddenException);
    expect(wallet.transferBetweenWallets).not.toHaveBeenCalled();
  });

  it('accumulates daily spend across multiple transfers and rejects once the cap is reached', async () => {
    limits.limitsFor.mockResolvedValue({ dailyCoinTransferLimit: 500 });

    await service.transfer('user-1', 'user-2', 300n); // 300/500 used
    await expect(service.transfer('user-1', 'user-3', 300n)).rejects.toThrow(ForbiddenException); // would be 600 > 500
  });

  it('completes a valid transfer, notifies the recipient, and does not flag a normal-looking transfer', async () => {
    const result = await service.transfer('user-1', 'user-2', 100n, 'дякую!');

    expect(wallet.transferBetweenWallets).toHaveBeenCalledWith(
      expect.objectContaining({ senderId: 'user-1', recipientId: 'user-2', amount: 100n }),
    );
    expect(notifications.notify).toHaveBeenCalled();
    expect(result.status).toBe('completed');
  });

  it('flags a transfer showing a structuring pattern without blocking it', async () => {
    fraud.checkStructuringPattern.mockResolvedValue({ suspicious: true, distinctRecipients: 9 });

    const result = await service.transfer('user-1', 'user-2', 50n);

    expect(wallet.transferBetweenWallets).toHaveBeenCalled(); // transfer still went through
    expect(result.status).toBe('flagged');
    expect(result.flaggedReason).toContain('9 distinct recipients');
  });
});
