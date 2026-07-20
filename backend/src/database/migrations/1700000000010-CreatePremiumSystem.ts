import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePremiumSystem1700000000010 implements MigrationInterface {
  name = 'CreatePremiumSystem1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cosmetic_items (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category          VARCHAR NOT NULL,
        name              TEXT NOT NULL,
        asset_url         TEXT,
        config            JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_animated       BOOLEAN NOT NULL DEFAULT false,
        requires_premium  BOOLEAN NOT NULL DEFAULT true,
        sort_order        SMALLINT NOT NULL DEFAULT 0,
        active            BOOLEAN NOT NULL DEFAULT true
      );
      CREATE INDEX idx_cosmetic_items_category ON cosmetic_items(category, active, sort_order);
    `);

    await queryRunner.query(`
      CREATE TABLE user_cosmetic_selections (
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category          VARCHAR NOT NULL,
        cosmetic_item_id  UUID NOT NULL REFERENCES cosmetic_items(id),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, category)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE user_profile_extras (
        user_id                     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        status_text                 TEXT,
        status_emoji                TEXT,
        animated_profile_enabled    BOOLEAN NOT NULL DEFAULT false,
        video_avatar_asset_id       UUID REFERENCES media_assets(id),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE premium_asset_packs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type        VARCHAR NOT NULL,
        name        TEXT NOT NULL,
        cover_url   TEXT,
        items       JSONB NOT NULL DEFAULT '[]'::jsonb,
        active      BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE premium_reactions (
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type  VARCHAR NOT NULL,
        target_id    UUID NOT NULL,
        emoji        VARCHAR NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, target_type, target_id)
      );
      CREATE INDEX idx_premium_reactions_target ON premium_reactions(target_type, target_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS premium_reactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS premium_asset_packs`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_profile_extras`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_cosmetic_selections`);
    await queryRunner.query(`DROP TABLE IF EXISTS cosmetic_items`);
  }
}
