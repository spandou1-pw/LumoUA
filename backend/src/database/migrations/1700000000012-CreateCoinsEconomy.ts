import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoinsEconomy1700000000012 implements MigrationInterface {
  name = 'CreateCoinsEconomy1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallets
        ADD COLUMN locked         BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN locked_reason  TEXT,
        ADD COLUMN locked_at      TIMESTAMPTZ;
    `);

    await queryRunner.query(`
      CREATE TABLE coin_transfers (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount          BIGINT NOT NULL CHECK (amount > 0),
        message         TEXT,
        status          VARCHAR NOT NULL DEFAULT 'completed',
        flagged_reason  TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_coin_transfers_sender_created ON coin_transfers(sender_id, created_at DESC);
      CREATE INDEX idx_coin_transfers_recipient_created ON coin_transfers(recipient_id, created_at DESC);
      CREATE INDEX idx_coin_transfers_flagged ON coin_transfers(status) WHERE status = 'flagged';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS coin_transfers`);
    await queryRunner.query(`
      ALTER TABLE wallets
        DROP COLUMN IF EXISTS locked,
        DROP COLUMN IF EXISTS locked_reason,
        DROP COLUMN IF EXISTS locked_at;
    `);
  }
}
