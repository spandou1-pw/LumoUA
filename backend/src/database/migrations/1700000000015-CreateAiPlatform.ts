import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiPlatform1700000000015 implements MigrationInterface {
  name = 'CreateAiPlatform1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ai_moderation_flags (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        target_type  VARCHAR NOT NULL,
        target_id    UUID NOT NULL,
        category     VARCHAR NOT NULL,
        confidence   SMALLINT NOT NULL,
        provider     VARCHAR NOT NULL,
        report_id    UUID REFERENCES reports(id),
        outcome      VARCHAR NOT NULL DEFAULT 'pending_review',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_ai_flags_target ON ai_moderation_flags(target_type, target_id);
    `);

    await queryRunner.query(`
      CREATE TABLE safety_filter_terms (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pattern    TEXT NOT NULL,
        is_regex   BOOLEAN NOT NULL DEFAULT false,
        category   VARCHAR NOT NULL,
        severity   SMALLINT NOT NULL DEFAULT 70,
        active     BOOLEAN NOT NULL DEFAULT true
      );
      CREATE INDEX idx_safety_filter_terms_category_active ON safety_filter_terms(category, active);
    `);

    await queryRunner.query(`
      CREATE TABLE spam_signals (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type  VARCHAR NOT NULL,
        target_id    UUID NOT NULL,
        signal_type  VARCHAR NOT NULL,
        details      JSONB,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_spam_signals_user_created ON spam_signals(user_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE feed_events (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        event_type  VARCHAR NOT NULL,
        position    SMALLINT,
        feed_type   VARCHAR,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_feed_events_user_created ON feed_events(user_id, created_at DESC);
      CREATE INDEX idx_feed_events_post ON feed_events(post_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS feed_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS spam_signals`);
    await queryRunner.query(`DROP TABLE IF EXISTS safety_filter_terms`);
    await queryRunner.query(`DROP TABLE IF EXISTS ai_moderation_flags`);
  }
}
