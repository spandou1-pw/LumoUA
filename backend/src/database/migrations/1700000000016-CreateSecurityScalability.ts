import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecurityScalability1700000000016 implements MigrationInterface {
  name = 'CreateSecurityScalability1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        ADD COLUMN device_name  TEXT,
        ADD COLUMN platform     TEXT,
        ADD COLUMN last_used_at TIMESTAMPTZ,
        ADD COLUMN ip_address   TEXT;
    `);

    await queryRunner.query(`
      CREATE TABLE data_deletion_requests (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status        VARCHAR NOT NULL DEFAULT 'pending',
        requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at  TIMESTAMPTZ,
        error         TEXT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS data_deletion_requests`);
    await queryRunner.query(`
      ALTER TABLE refresh_tokens
        DROP COLUMN IF EXISTS device_name,
        DROP COLUMN IF EXISTS platform,
        DROP COLUMN IF EXISTS last_used_at,
        DROP COLUMN IF EXISTS ip_address;
    `);
  }
}
