import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { ReferralCode } from './entities/referral-code.entity';
import { Referral } from './entities/referral.entity';
import { WalletService } from '../../wallet/wallet.service';
import { NotificationsService } from '../../notifications/notifications.service';

const REFERRAL_REWARD_COINS = 500n; // both referrer and the referred user get this once qualified
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8); // doc: excludes visually-ambiguous chars (0/O, 1/I/L)

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(ReferralCode) private readonly codes: Repository<ReferralCode>,
    @InjectRepository(Referral) private readonly referrals: Repository<Referral>,
    private readonly wallet: WalletService,
    private readonly notifications: NotificationsService,
  ) {}

  async getOrCreateCode(userId: string): Promise<string> {
    const existing = await this.codes.findOne({ where: { userId } });
    if (existing) return existing.code;

    // doc: collision retry — astronomically unlikely at this alphabet/length
    // (36^8) but checked rather than assumed, since a silent collision
    // would mean two users sharing a referral code.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const taken = await this.codes.exist({ where: { code } });
      if (!taken) {
        await this.codes.save(this.codes.create({ userId, code }));
        return code;
      }
    }
    throw new ConflictException('REFERRAL_CODE_GENERATION_FAILED');
  }

  /** doc 08 flow 1: called at registration if a referral code was supplied — records intent, grants nothing yet. */
  async recordSignup(referredUserId: string, code: string): Promise<Referral | null> {
    const referralCode = await this.codes.findOne({ where: { code } });
    if (!referralCode) return null; // invalid/unknown code — signup proceeds normally, just without a referral link
    if (referralCode.userId === referredUserId) return null; // doc: cannot refer yourself

    return this.referrals.save(
      this.referrals.create({ referrerId: referralCode.userId, referredUserId, status: 'pending' }),
    );
  }

  /**
   * doc: called from the email-verification success path (AuthService) —
   * the qualifying action. Idempotent: only ever transitions a genuinely
   * 'pending' row, so re-verification or a duplicate event never
   * double-rewards.
   */
  async qualify(referredUserId: string): Promise<void> {
    const referral = await this.referrals.findOne({ where: { referredUserId, status: 'pending' } });
    if (!referral) return; // no pending referral for this user — not an error, just nothing to do

    referral.status = 'qualified';
    referral.qualifiedAt = new Date();
    await this.referrals.save(referral);

    await Promise.all([
      this.wallet.credit({
        userId: referral.referrerId,
        amount: REFERRAL_REWARD_COINS,
        type: 'admin_adjustment', // doc: closest existing ledger type; a dedicated 'referral_reward' type is a one-line WalletTransactionType addition when this ships for real
        referenceType: 'referral',
        referenceId: referral.id,
        metadata: { role: 'referrer' },
      }),
      this.wallet.credit({
        userId: referral.referredUserId,
        amount: REFERRAL_REWARD_COINS,
        type: 'admin_adjustment',
        referenceType: 'referral',
        referenceId: referral.id,
        metadata: { role: 'referred' },
      }),
    ]);

    referral.status = 'rewarded';
    await this.referrals.save(referral);

    await this.notifications.notify(
      referral.referrerId,
      'new_follower',
      { referralId: referral.id },
      'Реферальна винагорода',
      `Ваш друг приєднався — ви отримали ${REFERRAL_REWARD_COINS} монет`,
    );
  }

  async myReferrals(referrerId: string): Promise<Referral[]> {
    return this.referrals.find({ where: { referrerId }, order: { createdAt: 'DESC' } });
  }

  async stats(referrerId: string): Promise<{ total: number; qualified: number; pending: number }> {
    const [total, qualified, pending] = await Promise.all([
      this.referrals.count({ where: { referrerId } }),
      this.referrals.count({ where: { referrerId, status: 'rewarded' } }),
      this.referrals.count({ where: { referrerId, status: 'pending' } }),
    ]);
    return { total, qualified, pending };
  }
}
