import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * doc PROFILE.md "Badge Showcase" vs Stage 7's badge *selection*: a user
 * has exactly one active badge shown beside their username
 * (UserCosmeticSelection, category='badge') but may want to display
 * several earned badges as a showcase gallery — the same "equipped vs
 * collection display" split as Gift Showcase (Stage 8) vs Gift Inventory.
 */
@Entity('badge_showcase_slots')
export class BadgeShowcaseSlot {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ type: 'smallint' })
  position: number;

  @Column({ name: 'cosmetic_item_id', type: 'uuid' })
  cosmeticItemId: string;
}
