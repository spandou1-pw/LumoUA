import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1700000000005 implements MigrationInterface {
  name = 'CreateNotifications1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notifications (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type          VARCHAR NOT NULL,
        payload       JSONB NOT NULL,
        read_at       TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE device_push_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id   TEXT NOT NULL,
        platform    VARCHAR NOT NULL,
        push_token  TEXT NOT NULL,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id, device_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE notification_preferences (
        user_id                     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        messages_enabled            BOOLEAN NOT NULL DEFAULT true,
        social_engagement_enabled   BOOLEAN NOT NULL DEFAULT true,
        friend_requests_enabled     BOOLEAN NOT NULL DEFAULT true
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notification_preferences`);
    await queryRunner.query(`DROP TABLE IF EXISTS device_push_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
  }
}
