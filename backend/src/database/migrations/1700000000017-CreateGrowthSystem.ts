import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGrowthSystem1700000000017 implements MigrationInterface {
  name = 'CreateGrowthSystem1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE referral_codes (
        user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        code        CITEXT UNIQUE NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE referrals (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id   UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        status             VARCHAR NOT NULL DEFAULT 'pending',
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        qualified_at       TIMESTAMPTZ
      );
      CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
    `);

    await queryRunner.query(`
      CREATE TABLE founder_program_members (
        user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        signup_rank  INT NOT NULL,
        granted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE mission_definitions (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key            CITEXT UNIQUE NOT NULL,
        title          TEXT NOT NULL,
        description    TEXT NOT NULL,
        period         VARCHAR NOT NULL,
        target_count   INT NOT NULL,
        reward_coins   BIGINT NOT NULL,
        season_tag     TEXT,
        active         BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE user_mission_progress (
        user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mission_definition_id  UUID NOT NULL REFERENCES mission_definitions(id) ON DELETE CASCADE,
        period_key             TEXT NOT NULL,
        progress_count         INT NOT NULL DEFAULT 0,
        completed_at           TIMESTAMPTZ,
        rewarded_at            TIMESTAMPTZ,
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, mission_definition_id, period_key)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE experiments (
        key          CITEXT PRIMARY KEY,
        description  TEXT NOT NULL,
        variants     JSONB NOT NULL,
        active       BOOLEAN NOT NULL DEFAULT false
      );
    `);

    await queryRunner.query(`
      CREATE TABLE experiment_events (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        experiment_key    CITEXT NOT NULL,
        variant_key       TEXT NOT NULL,
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type        VARCHAR NOT NULL,
        conversion_goal   TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_experiment_events_key_variant_type ON experiment_events(experiment_key, variant_key, event_type);
    `);

    await queryRunner.query(`
      CREATE TABLE analytics_events (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_name   TEXT NOT NULL,
        properties   JSONB,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_analytics_events_user_name_created ON analytics_events(user_id, event_name, created_at);
      CREATE INDEX idx_analytics_events_name_created ON analytics_events(event_name, created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE crash_reports (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id),
        platform      VARCHAR NOT NULL,
        app_version   TEXT NOT NULL,
        message       TEXT NOT NULL,
        stack_trace   TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_crash_reports_platform_version_created ON crash_reports(platform, app_version, created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE performance_metrics (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id),
        platform      VARCHAR NOT NULL,
        metric_name   TEXT NOT NULL,
        duration_ms   INT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_performance_metrics_name_platform_created ON performance_metrics(metric_name, platform, created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE campaigns (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel           VARCHAR NOT NULL,
        segment           VARCHAR NOT NULL,
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
    await queryRunner.query(`DROP TABLE IF EXISTS campaigns`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance_metrics`);
    await queryRunner.query(`DROP TABLE IF EXISTS crash_reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS analytics_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS experiment_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS experiments`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_mission_progress`);
    await queryRunner.query(`DROP TABLE IF EXISTS mission_definitions`);
    await queryRunner.query(`DROP TABLE IF EXISTS founder_program_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS referrals`);
    await queryRunner.query(`DROP TABLE IF EXISTS referral_codes`);
  }
}
