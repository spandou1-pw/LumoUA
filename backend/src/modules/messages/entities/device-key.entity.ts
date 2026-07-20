import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * doc 26: server only ever brokers public key material for X3DH — it never
 * participates in the cryptographic handshake itself. Private key halves
 * never leave the client device.
 */
@Entity('device_keys')
@Unique(['userId', 'deviceId'])
export class DeviceKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ name: 'identity_key', type: 'bytea' })
  identityKey: Buffer;

  @Column({ name: 'signed_prekey', type: 'bytea' })
  signedPrekey: Buffer;

  @Column({ name: 'signed_prekey_signature', type: 'bytea' })
  signedPrekeySignature: Buffer;

  /** Pool of unused one-time prekeys — consumed (removed) as sessions are established. */
  @Column({ name: 'one_time_prekeys', type: 'jsonb' })
  oneTimePrekeys: string[]; // base64-encoded public keys
}
