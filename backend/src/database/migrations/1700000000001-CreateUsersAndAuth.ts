import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndAuth1700000000001 implements MigrationInterface {
  name = 'CreateUsersAndAuth1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`); // gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`); // case-insensitive username/email

    await queryRunner.query(`
      CREATE TABLE users (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username          CITEXT UNIQUE NOT NULL,
        email             CITEXT UNIQUE,
        password_hash     TEXT,
        display_name      TEXT NOT NULL,
        avatar_url        TEXT,
        cover_url         TEXT,
        bio               TEXT,
        locale            VARCHAR NOT NULL DEFAULT 'uk',
        is_private        BOOLEAN NOT NULL DEFAULT false,
        is_verified       BOOLEAN NOT NULL DEFAULT false,
        email_verified_at TIMESTAMPTZ,
        status            VARCHAR NOT NULL DEFAULT 'active',
        role              VARCHAR NOT NULL DEFAULT 'user',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE auth_identities (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider      VARCHAR NOT NULL,
        provider_uid  TEXT,
        UNIQUE (provider, provider_uid)
      );
      CREATE INDEX idx_auth_identities_user ON auth_identities(user_id);
    `);

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id                 TEXT NOT NULL,
        token_hash                TEXT UNIQUE NOT NULL,
        expires_at                TIMESTAMPTZ NOT NULL,
        revoked_at                TIMESTAMPTZ,
        replaced_by_token_hash    TEXT,
        created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_refresh_tokens_user_device ON refresh_tokens(user_id, device_id);
    `);

    await queryRunner.query(`
      CREATE TABLE email_verification_codes (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash    TEXT NOT NULL,
        expires_at   TIMESTAMPTZ NOT NULL,
        consumed_at  TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_verification_codes_user ON email_verification_codes(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS email_verification_codes`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS auth_identities`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
