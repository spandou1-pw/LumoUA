import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostsAndEngagement1700000000008 implements MigrationInterface {
  name = 'CreatePostsAndEngagement1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE posts (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body         TEXT,
        visibility   VARCHAR NOT NULL DEFAULT 'default',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at   TIMESTAMPTZ
      );
      -- profile timeline query (doc 20/27)
      CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
      -- global feed query (doc 27)
      CREATE INDEX idx_posts_created ON posts(created_at DESC) WHERE deleted_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE post_media (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        media_asset_id  UUID NOT NULL REFERENCES media_assets(id),
        position        SMALLINT NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_post_media_post ON post_media(post_id, position);
    `);

    await queryRunner.query(`
      CREATE TABLE comments (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body        TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at  TIMESTAMPTZ
      );
      CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);
    `);

    await queryRunner.query(`
      CREATE TABLE likes (
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type VARCHAR NOT NULL,
        target_id   UUID NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, target_type, target_id)
      );
      CREATE INDEX idx_likes_target ON likes(target_type, target_id);
    `);

    await queryRunner.query(`
      CREATE TABLE bookmarks (
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, post_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS bookmarks`);
    await queryRunner.query(`DROP TABLE IF EXISTS likes`);
    await queryRunner.query(`DROP TABLE IF EXISTS comments`);
    await queryRunner.query(`DROP TABLE IF EXISTS post_media`);
    await queryRunner.query(`DROP TABLE IF EXISTS posts`);
  }
}
