import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendGiftEcosystem1700000000011 implements MigrationInterface {
  name = 'ExtendGiftEcosystem1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE gift_categories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        slug        CITEXT UNIQUE NOT NULL,
        sort_order  SMALLINT NOT NULL DEFAULT 0,
        active      BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      ALTER TABLE gift_catalog_items
        ADD COLUMN category_id       UUID REFERENCES gift_categories(id),
        ADD COLUMN animation_url     TEXT,
        ADD COLUMN is_animated       BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN rarity            VARCHAR NOT NULL DEFAULT 'common',
        ADD COLUMN total_supply      BIGINT,
        ADD COLUMN remaining_supply  BIGINT,
        ADD COLUMN season_tag        TEXT,
        ADD COLUMN available_from    TIMESTAMPTZ,
        ADD COLUMN available_until   TIMESTAMPTZ,
        ADD CONSTRAINT chk_remaining_supply_non_negative CHECK (remaining_supply IS NULL OR remaining_supply >= 0);
      CREATE INDEX idx_gift_catalog_items_category ON gift_catalog_items(category_id);
      CREATE INDEX idx_gift_catalog_items_season ON gift_catalog_items(season_tag) WHERE season_tag IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE gift_transactions
        ADD COLUMN hidden         BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN hidden_reason  TEXT;
    `);

    await queryRunner.query(`
      CREATE TABLE user_gift_inventory (
        user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gift_catalog_item_id  UUID NOT NULL REFERENCES gift_catalog_items(id),
        quantity              INT NOT NULL DEFAULT 0,
        first_received_at     TIMESTAMPTZ NOT NULL,
        last_received_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, gift_catalog_item_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE gift_showcase_slots (
        user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position              SMALLINT NOT NULL,
        gift_catalog_item_id  UUID NOT NULL REFERENCES gift_catalog_items(id),
        PRIMARY KEY (user_id, position)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS gift_showcase_slots`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_gift_inventory`);
    await queryRunner.query(`ALTER TABLE gift_transactions DROP COLUMN IF EXISTS hidden, DROP COLUMN IF EXISTS hidden_reason`);
    await queryRunner.query(`
      ALTER TABLE gift_catalog_items
        DROP COLUMN IF EXISTS category_id,
        DROP COLUMN IF EXISTS animation_url,
        DROP COLUMN IF EXISTS is_animated,
        DROP COLUMN IF EXISTS rarity,
        DROP COLUMN IF EXISTS total_supply,
        DROP COLUMN IF EXISTS remaining_supply,
        DROP COLUMN IF EXISTS season_tag,
        DROP COLUMN IF EXISTS available_from,
        DROP COLUMN IF EXISTS available_until;
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS gift_categories`);
  }
}
