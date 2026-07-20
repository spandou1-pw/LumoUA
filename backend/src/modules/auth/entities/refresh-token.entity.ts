import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * doc 23: refresh tokens are opaque (not JWT), stored hashed, scoped per
 * device, and rotated on every use. `replacedByTokenHash` set on rotation
 * lets us detect reuse of an already-rotated token (theft signal) and
 * invalidate the whole chain for that device.
 */
@Entity('refresh_tokens')
@Index(['userId', 'deviceId'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  /** doc AUTH-7/SESSIONS.md: human-readable device label + platform, populated at login from client-supplied headers — lets a user recognize "which device is this" in their session list rather than seeing only an opaque device_id. */
  @Column({ name: 'device_name', nullable: true })
  deviceName: string | null;

  @Column({ name: 'platform', nullable: true })
  platform: string | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string | null;

  /** SHA-256 hash of the opaque token — the raw token is never stored. */
  @Column({ name: 'token_hash', unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'replaced_by_token_hash', nullable: true })
  replacedByTokenHash: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
