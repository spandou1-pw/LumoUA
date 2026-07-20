import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessaging1700000000003 implements MigrationInterface {
  name = 'CreateMessaging1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE conversations (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type       VARCHAR NOT NULL DEFAULT 'direct',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE conversation_participants (
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role            VARCHAR NOT NULL DEFAULT 'member',
        joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_read_at    TIMESTAMPTZ,
        PRIMARY KEY (conversation_id, user_id)
      );
      CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
    `);

    await queryRunner.query(`
      CREATE TABLE messages (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id        UUID NOT NULL REFERENCES users(id),
        ciphertext       BYTEA NOT NULL,
        ciphertext_meta  JSONB NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at       TIMESTAMPTZ
      );
      -- chat pagination (doc 20/29)
      CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE device_keys (
        id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id                 TEXT NOT NULL,
        identity_key              BYTEA NOT NULL,
        signed_prekey             BYTEA NOT NULL,
        signed_prekey_signature   BYTEA NOT NULL,
        one_time_prekeys          JSONB NOT NULL DEFAULT '[]'::jsonb,
        UNIQUE (user_id, device_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS device_keys`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversation_participants`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversations`);
  }
}
