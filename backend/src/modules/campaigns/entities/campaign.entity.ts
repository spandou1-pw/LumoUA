import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type CampaignChannel = 'push' | 'email';
export type CampaignSegment = 'all_active' | 'inactive_7d' | 'inactive_30d' | 'non_premium' | 'premium';
export type CampaignStatus = 'pending' | 'sending' | 'completed' | 'failed';

/**
 * doc GROWTH.md: distinct from Stage 13's `Announcement` (always
 * broadcast to every active user) — a Campaign targets a `segment`, real
 * SQL predicates computed at send time (see `CampaignsService`), not a
 * static precomputed list that could go stale between creation and send.
 */
@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  channel: CampaignChannel;

  @Column({ type: 'varchar' })
  segment: CampaignSegment;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: CampaignStatus;

  @Column({ name: 'recipient_count', type: 'int', nullable: true })
  recipientCount: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
