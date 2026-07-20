import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMonetization1700000000009 implements MigrationInterface {
  name = 'CreateMonetization1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------- Wallet (append-only ledger + cached balance) ----------
    await queryRunner.query(`
      CREATE TABLE wallets (
        user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        coin_balance  BIGINT NOT NULL DEFAULT 0,
        version       INT NOT NULL DEFAULT 1,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_coin_balance_non_negative CHECK (coin_balance >= 0)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE wallet_transactions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type            VARCHAR NOT NULL,
        amount          BIGINT NOT NULL,
        balance_after   BIGINT NOT NULL,
        reference_type  TEXT,
        reference_id    UUID,
        metadata        JSONB,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);
    `);

    // ---------- Catalog ----------
    await queryRunner.query(`
      CREATE TABLE coin_packs (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                TEXT NOT NULL,
        coin_amount         BIGINT NOT NULL,
        price_usd_cents     INT NOT NULL,
        apple_product_id    TEXT,
        google_product_id   TEXT,
        stripe_price_id     TEXT,
        active              BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE premium_plans (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                TEXT NOT NULL,
        price_usd_cents     INT NOT NULL,
        billing_interval    VARCHAR NOT NULL,
        apple_product_id    TEXT,
        google_product_id   TEXT,
        stripe_price_id     TEXT,
        perks               JSONB NOT NULL DEFAULT '[]'::jsonb,
        active              BOOLEAN NOT NULL DEFAULT true
      );
    `);

    // ---------- Purchases & refunds ----------
    await queryRunner.query(`
      CREATE TABLE purchases (
        id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform                  VARCHAR NOT NULL,
        product_type              VARCHAR NOT NULL,
        product_id                UUID NOT NULL,
        platform_transaction_id   TEXT NOT NULL,
        status                    VARCHAR NOT NULL DEFAULT 'pending',
        amount_usd_cents          INT NOT NULL,
        raw_receipt               TEXT,
        created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      -- doc PAYMENTS.md: the actual replay-protection mechanism — a
      -- transaction id can only ever be fulfilled once, enforced by Postgres.
      CREATE UNIQUE INDEX idx_purchases_platform_tx_unique ON purchases(platform_transaction_id);
      CREATE INDEX idx_purchases_user_created ON purchases(user_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE refund_records (
        id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_id                   UUID NOT NULL REFERENCES purchases(id),
        refunded_amount_usd_cents     INT NOT NULL,
        reason                        TEXT NOT NULL,
        initiated_by                  VARCHAR NOT NULL,
        admin_actor_id                UUID REFERENCES users(id),
        created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // ---------- Subscriptions ----------
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id                     UUID NOT NULL REFERENCES premium_plans(id),
        platform                    VARCHAR NOT NULL,
        platform_subscription_id    TEXT NOT NULL,
        status                      VARCHAR NOT NULL,
        current_period_end          TIMESTAMPTZ NOT NULL,
        cancel_at_period_end        BOOLEAN NOT NULL DEFAULT false,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX idx_subscriptions_platform_sub_unique ON subscriptions(platform_subscription_id);
      CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
    `);

    // ---------- Gifts ----------
    await queryRunner.query(`
      CREATE TABLE gift_catalog_items (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        coin_cost   BIGINT NOT NULL,
        icon_url    TEXT NOT NULL,
        active      BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE gift_transactions (
        id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        gift_catalog_item_id   UUID NOT NULL REFERENCES gift_catalog_items(id),
        coin_cost              BIGINT NOT NULL,
        message                TEXT,
        context_type           TEXT,
        context_id             UUID,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_gift_tx_recipient_created ON gift_transactions(recipient_id, created_at DESC);
      CREATE INDEX idx_gift_tx_sender_created ON gift_transactions(sender_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS gift_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS gift_catalog_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS refund_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS purchases`);
    await queryRunner.query(`DROP TABLE IF EXISTS premium_plans`);
    await queryRunner.query(`DROP TABLE IF EXISTS coin_packs`);
    await queryRunner.query(`DROP TABLE IF EXISTS wallet_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS wallets`);
  }
}
