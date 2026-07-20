import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profile_extras')
export class UserProfileExtras {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** Shown beside the username (doc: "Status beside username"), e.g. "🎨 Designing" — premium-gated at the service layer. */
  @Column({ name: 'status_text', nullable: true })
  statusText: string | null;

  @Column({ name: 'status_emoji', nullable: true })
  statusEmoji: string | null;

  /** doc: "Animated Profile" — client-side interpretation flag; the actual animation is a
   * client rendering concern (doc 16 motion tokens), this just toggles it on/off per user. */
  @Column({ name: 'animated_profile_enabled', default: false })
  animatedProfileEnabled: boolean;

  /** doc: "Video Avatar" — FK to a media_assets row with media_type='video', owner_type='avatar'
   * (doc 30 pipeline already supports video; this just points at which asset is the active avatar
   * when it's a video rather than the plain users.avatar_url image). */
  @Column({ name: 'video_avatar_asset_id', type: 'uuid', nullable: true })
  videoAvatarAssetId: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
