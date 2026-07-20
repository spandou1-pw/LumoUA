import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * doc 26/31: `ciphertext` is opaque to the application — the server never
 * decrypts it and never will (E2E via Signal Protocol, doc 26). Logging
 * middleware (doc 31 interceptor) explicitly redacts this field even though
 * it's already encrypted, as defense against a future bug that might log a
 * decrypted client-side payload by mistake.
 */
@Entity('messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ type: 'bytea' })
  ciphertext: Buffer;

  /** Non-sensitive Signal Protocol ratchet/session metadata needed for decryption (doc 20). */
  @Column({ name: 'ciphertext_meta', type: 'jsonb' })
  ciphertextMeta: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  /** "Delete for everyone" (doc 26) — ciphertext is purged, not just flagged. */
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
