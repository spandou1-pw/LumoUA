import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialGraph1700000000002 implements MigrationInterface {
  name = 'CreateSocialGraph1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE follows (
        follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        followee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (follower_id, followee_id)
      );
      -- fan-out-on-read Following feed query (doc 27)
      CREATE INDEX idx_follows_followee ON follows(followee_id);
    `);

    await queryRunner.query(`
      CREATE TABLE blocks (
        blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (blocker_id, blocked_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE mutes (
        muter_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        muted_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (muter_id, muted_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE friend_requests (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addressee_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status         VARCHAR NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (requester_id, addressee_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS friend_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS mutes`);
    await queryRunner.query(`DROP TABLE IF EXISTS blocks`);
    await queryRunner.query(`DROP TABLE IF EXISTS follows`);
  }
}
