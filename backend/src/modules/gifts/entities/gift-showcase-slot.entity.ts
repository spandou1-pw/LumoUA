import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('gift_showcase_slots')
export class GiftShowcaseSlot {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @PrimaryColumn({ type: 'smallint' })
  position: number;

  @Column({ name: 'gift_catalog_item_id', type: 'uuid' })
  giftCatalogItemId: string;
}
