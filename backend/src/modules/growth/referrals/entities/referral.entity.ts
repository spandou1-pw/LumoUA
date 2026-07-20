import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type ReferralStatus = 'pending' | 'qualified' | 'rewarded' | 'rejected';

/**
 * doc GROWTH.md: `status` starts 'pending' at signup and only becomes
 * 'qualified' once the referred user completes a real qualifying action
 * (email verification is used here — doc 08 flow 1's own activation
 * signal) — rewarding purely on signup would be trivially farmable with
 * throwaway accounts. Reward is granted exactly once, at the
 * pending->qualified transition, enforced by only ever reading/writing
 * 'pending' rows in `ReferralsService.qualify`.
 */
@Entity('referrals')
@Index(['referrerId'])
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'referrer_id', type: 'uuid' })
  referrerId: string;

  @Column({ name: 'referred_user_id', type: 'uuid', unique: true })
  referredUserId: string; // a user can only ever be referred once — enforced at the DB level

  @Column({ type: 'varchar', default: 'pending' })
  status: ReferralStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'qualified_at', type: 'timestamptz', nullable: true })
  qualifiedAt: Date | null;
}
