import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type MediaType = 'image' | 'video';
export type MediaOwnerType = 'post' | 'avatar' | 'cover' | 'message' | 'community';
export type MediaStatus = 'pending' | 'processing' | 'ready' | 'failed';

/**
 * doc 30: storage key structure {env}/{entity_type}/{entity_id}/{asset_id}.{ext}.
 * This table is the source-of-truth asset-location index; the key structure
 * itself is defense-in-depth, not the sole record.
 */
@Entity('media_assets')
@Index(['ownerType', 'ownerId'])
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'uploader_id', type: 'uuid' })
  uploaderId: string;

  @Column({ name: 'owner_type', type: 'varchar' })
  ownerType: MediaOwnerType;

  /** Nullable until attached — e.g. uploaded before the post it belongs to is created. */
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ name: 'media_type', type: 'varchar' })
  mediaType: MediaType;

  @Column({ name: 'storage_key' })
  storageKey: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: MediaStatus;

  @Column({ type: 'smallint', default: 0 })
  position: number; // carousel order (doc 20)

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  /** blurhash placeholder string for progressive loading (doc 17/30). */
  @Column({ name: 'blurhash', nullable: true })
  blurhash: string | null;

  /** Populated once responsive size variants exist (doc 30 image pipeline). */
  @Column({ type: 'jsonb', nullable: true })
  variants: Record<string, string> | null;

  /** For video: HLS/DASH manifest key once transcoding completes (doc 30). */
  @Column({ name: 'playback_manifest_key', nullable: true })
  playbackManifestKey: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
