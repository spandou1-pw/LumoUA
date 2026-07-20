import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * doc 18/42: the lightweight in-house flag system referenced since Stage 4
 * but never actually built until now. `rolloutPercentage` supports doc
 * 42's phased-rollout pattern (0-100, deterministic per-user via a hash of
 * userId+key so the same user consistently lands on the same side of the
 * rollout rather than flapping between requests).
 */
@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryColumn({ type: 'citext' })
  key: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ name: 'rollout_percentage', type: 'smallint', default: 100 })
  rolloutPercentage: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
