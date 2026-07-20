import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReferralsService } from '../../src/modules/growth/referrals/referrals.service';
import { ReferralCode } from '../../src/modules/growth/referrals/entities/referral-code.entity';
import { Referral } from '../../src/modules/growth/referrals/entities/referral.entity';
import { WalletService } from '../../src/modules/wallet/wallet.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let codesRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; exist: jest.Mock };
  let referralsRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let wallet: { credit: jest.Mock };
  let notifications: { notify: jest.Mock };

  beforeEach(async () => {
    codesRepo = { findOne: jest.fn(), save: jest.fn((x) => x), create: jest.fn((x) => x), exist: jest.fn() };
    referralsRepo = { findOne: jest.fn(), save: jest.fn((x) => x), create: jest.fn((x) => ({ ...x })) };
    wallet = { credit: jest.fn() };
    notifications = { notify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: getRepositoryToken(ReferralCode), useValue: codesRepo },
        { provide: getRepositoryToken(Referral), useValue: referralsRepo },
        { provide: WalletService, useValue: wallet },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ReferralsService);
  });

  describe('recordSignup', () => {
    it('returns null for an unknown referral code (signup proceeds without a referral link)', async () => {
      codesRepo.findOne.mockResolvedValue(null);
      const result = await service.recordSignup('new-user', 'BADCODE');
      expect(result).toBeNull();
      expect(referralsRepo.save).not.toHaveBeenCalled();
    });

    it('rejects self-referral (a user using their own code)', async () => {
      codesRepo.findOne.mockResolvedValue({ userId: 'user-1', code: 'MYCODE' });
      const result = await service.recordSignup('user-1', 'MYCODE');
      expect(result).toBeNull();
      expect(referralsRepo.save).not.toHaveBeenCalled();
    });

    it('creates a pending referral for a valid code from a different user', async () => {
      codesRepo.findOne.mockResolvedValue({ userId: 'referrer-1', code: 'GOODCODE' });
      const result = await service.recordSignup('new-user', 'GOODCODE');
      expect(result).toMatchObject({ referrerId: 'referrer-1', referredUserId: 'new-user', status: 'pending' });
    });
  });

  describe('qualify', () => {
    it('is a no-op when there is no pending referral for the user', async () => {
      referralsRepo.findOne.mockResolvedValue(null);
      await service.qualify('user-with-no-referral');
      expect(wallet.credit).not.toHaveBeenCalled();
    });

    it('rewards both referrer and referred user exactly once on qualification', async () => {
      referralsRepo.findOne.mockResolvedValue({
        id: 'referral-1',
        referrerId: 'referrer-1',
        referredUserId: 'referred-1',
        status: 'pending',
      });

      await service.qualify('referred-1');

      expect(wallet.credit).toHaveBeenCalledTimes(2);
      expect(wallet.credit).toHaveBeenCalledWith(expect.objectContaining({ userId: 'referrer-1', amount: 500n }));
      expect(wallet.credit).toHaveBeenCalledWith(expect.objectContaining({ userId: 'referred-1', amount: 500n }));
      expect(notifications.notify).toHaveBeenCalled();
    });

    it('only ever transitions a pending referral — a second qualify() call for an already-processed user finds nothing pending and is a no-op', async () => {
      // Simulates the idempotency guarantee: findOne is scoped to
      // status:'pending', so once qualify() has run once and the row is no
      // longer 'pending', a duplicate event finds no match.
      referralsRepo.findOne.mockResolvedValue(null);
      await service.qualify('referred-1');
      expect(wallet.credit).not.toHaveBeenCalled();
    });
  });
});
