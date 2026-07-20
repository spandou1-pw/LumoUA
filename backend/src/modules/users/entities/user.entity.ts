import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlatformRole } from '../../../common/enums/role.enum';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';
export type UserLocale = 'uk' | 'en';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'citext' })
  username: string;

  @Index({ unique: true })
  @Column({ type: 'citext', nullable: true })
  email: string | null;

  /** argon2id hash — never plaintext (doc 23/31). Excluded from default select. */
  @Column({ name: 'password_hash', type: 'text', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', default: 'uk' })
  locale: UserLocale;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'varchar', default: 'active' })
  status: UserStatus;

  /** Platform role (doc 24) — 'user' default; 'moderator'/'admin' assigned explicitly. */
  @Column({ type: 'varchar', default: PlatformRole.USER })
  role: PlatformRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
