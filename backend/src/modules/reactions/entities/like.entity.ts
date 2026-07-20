import { CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export type LikeTargetType = 'post' | 'comment';

/**
 * doc 20: polymorphic target_type/target_id pattern used deliberately in
 * only two-three places (this + reports) — not a general pattern applied
 * broadly, since over-using it loses FK referential-integrity guarantees.
 */
@Entity('likes')
@Index(['targetType', 'targetId'])
export class Like {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ name: 'target_type', type: 'varchar' })
  targetType: LikeTargetType;

  @PrimaryColumn({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
