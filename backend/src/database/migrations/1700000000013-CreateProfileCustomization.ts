import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileCustomization1700000000013 implements MigrationInterface {
  name = 'CreateProfileCustomization1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE achievements (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key          CITEXT UNIQUE NOT NULL,
        name         TEXT NOT NULL,
        description  TEXT NOT NULL,
        icon_url     TEXT NOT NULL,
        tier         VARCHAR NOT NULL DEFAULT 'bronze',
        active       BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE user_achievements (
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id  UUID NOT NULL REFERENCES achievements(id),
        earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, achievement_id)
      );
      CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
    `);

    await queryRunner.query(`
      CREATE TABLE badge_showcase_slots (
        user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position          SMALLINT NOT NULL,
        cosmetic_item_id  UUID NOT NULL REFERENCES cosmetic_items(id),
        PRIMARY KEY (user_id, position)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE achievement_showcase_slots (
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position        SMALLINT NOT NULL,
        achievement_id  UUID NOT NULL REFERENCES achievements(id),
        PRIMARY KEY (user_id, position)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS achievement_showcase_slots`);
    await queryRunner.query(`DROP TABLE IF EXISTS badge_showcase_slots`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_achievements`);
    await queryRunner.query(`DROP TABLE IF EXISTS achievements`);
  }
}
