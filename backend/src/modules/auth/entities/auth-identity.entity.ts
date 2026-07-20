import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AuthProvider = 'email' | 'google' | 'apple';

@Entity('auth_identities')
@Index(['provider', 'providerUid'], { unique: true })
export class AuthIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  provider: AuthProvider;

  @Column({ name: 'provider_uid', nullable: true })
  providerUid: string | null;
}
