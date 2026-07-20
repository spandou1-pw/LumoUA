import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminPlatform1700000000014 implements MigrationInterface {
  name = 'CreateAdminPlatform1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE reports (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id       UUID REFERENCES users(id) ON DELETE CASCADE,
        filed_by_ai       BOOLEAN NOT NULL DEFAULT false,
        target_type       VARCHAR NOT NULL,
        target_id         UUID NOT NULL,
        reason            VARCHAR NOT NULL,
        detail            TEXT,
        status            VARCHAR NOT NULL DEFAULT 'open',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at       TIMESTAMPTZ,
        resolved_by       UUID REFERENCES users(id),
        resolution_note   TEXT
      );
      CREATE INDEX idx_reports_status_created ON reports(status, created_at);
      CREATE INDEX idx_reports_target ON reports(target_type, target_id);
    `);

    await queryRunner.query(`
      CREATE TABLE feature_flags (
        key                  CITEXT PRIMARY KEY,
        description          TEXT NOT NULL,
        enabled              BOOLEAN NOT NULL DEFAULT false,
        rollout_percentage   SMALLINT NOT NULL DEFAULT 100,
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE system_configuration (
        key          CITEXT PRIMARY KEY,
        value        JSONB NOT NULL,
        description  TEXT,
        updated_by   UUID REFERENCES users(id),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE announcements (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title             TEXT NOT NULL,
        body              TEXT NOT NULL,
        created_by        UUID NOT NULL REFERENCES users(id),
        status            VARCHAR NOT NULL DEFAULT 'pending',
        recipient_count   INT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at      TIMESTAMPTZ
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS announcements`);
    await queryRunner.query(`DROP TABLE IF EXISTS system_configuration`);
    await queryRunner.query(`DROP TABLE IF EXISTS feature_flags`);
    await queryRunner.query(`DROP TABLE IF EXISTS reports`);
  }
}
