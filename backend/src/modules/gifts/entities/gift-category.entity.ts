import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gift_categories')
export class GiftCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'citext', unique: true })
  slug: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  active: boolean;
}
