import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaAssets1700000000004 implements MigrationInterface {
  name = 'CreateMediaAssets1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE media_assets (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        uploader_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        owner_type              VARCHAR NOT NULL,
        owner_id                UUID,
        media_type              VARCHAR NOT NULL,
        storage_key             TEXT NOT NULL,
        status                  VARCHAR NOT NULL DEFAULT 'pending',
        position                SMALLINT NOT NULL DEFAULT 0,
        width                   INT,
        height                  INT,
        blurhash                TEXT,
        variants                JSONB,
        playback_manifest_key   TEXT,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_media_assets_owner ON media_assets(owner_type, owner_id);
      -- orphan-cleanup scan (doc 30): unreferenced uploads older than 24h
      CREATE INDEX idx_media_assets_orphan_scan ON media_assets(owner_id, created_at) WHERE owner_id IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS media_assets`);
  }
}
