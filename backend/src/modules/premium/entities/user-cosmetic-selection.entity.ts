import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CosmeticCategory } from './cosmetic-item.entity';

@Entity('user_cosmetic_selections')
export class UserCosmeticSelection {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ type: 'varchar' })
  category: CosmeticCategory;

  @Column({ name: 'cosmetic_item_id', type: 'uuid' })
  cosmeticItemId: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
