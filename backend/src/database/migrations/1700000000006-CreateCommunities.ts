import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunities1700000000006 implements MigrationInterface {
  name = 'CreateCommunities1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE communities (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug         CITEXT UNIQUE NOT NULL,
        name         TEXT NOT NULL,
        description  TEXT,
        rules        TEXT,
        avatar_url   TEXT,
        cover_url    TEXT,
        visibility   VARCHAR NOT NULL DEFAULT 'public',
        created_by   UUID NOT NULL REFERENCES users(id),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE community_members (
        community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role          VARCHAR NOT NULL DEFAULT 'member',
        joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (community_id, user_id)
      );
      CREATE INDEX idx_community_members_user ON community_members(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS community_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS communities`);
  }
}
