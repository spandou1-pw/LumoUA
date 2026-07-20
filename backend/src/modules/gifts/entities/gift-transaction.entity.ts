import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gift_transactions')
@Index(['recipientId', 'createdAt'])
export class GiftTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId: string;

  @Column({ name: 'gift_catalog_item_id', type: 'uuid' })
  giftCatalogItemId: string;

  @Column({ name: 'coin_cost', type: 'bigint' })
  coinCost: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  /** doc GIFTS.md Gift Moderation: an admin can hide a gift's message/visibility from public
   * display (e.g. an abusive message attached to an otherwise-valid gift) without reversing
   * the underlying coin transaction — moderation and refund are deliberately separate actions. */
  @Column({ default: false })
  hidden: boolean;

  @Column({ name: 'hidden_reason', type: 'text', nullable: true })
  hiddenReason: string | null;

  /** Attached to a post/comment/profile, or standalone — nullable context. */
  @Column({ name: 'context_type', nullable: true })
  contextType: string | null;

  @Column({ name: 'context_id', type: 'uuid', nullable: true })
  contextId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
