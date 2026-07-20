import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAuditLog1700000000007 implements MigrationInterface {
  name = 'CreateAdminAuditLog1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE admin_audit_log (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id    UUID NOT NULL REFERENCES users(id),
        action      TEXT NOT NULL,
        target_type TEXT,
        target_id   UUID,
        metadata    JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_admin_audit_log_actor ON admin_audit_log(actor_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admin_audit_log`);
  }
}
