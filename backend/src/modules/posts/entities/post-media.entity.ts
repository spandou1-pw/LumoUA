import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('post_media')
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Column({ name: 'media_asset_id', type: 'uuid' })
  mediaAssetId: string; // FK to media_assets (doc 30) — resolved via FilesService

  @Column({ type: 'smallint', default: 0 })
  position: number;
}
