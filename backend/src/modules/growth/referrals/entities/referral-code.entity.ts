import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('referral_codes')
export class ReferralCode {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'citext', unique: true })
  code: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
