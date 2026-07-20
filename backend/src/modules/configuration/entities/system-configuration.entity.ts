import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * doc ADMIN.md "Configuration": platform-wide settings an admin can change
 * without a deploy (e.g. maintenance-mode banner text, max-upload-size
 * override, support-contact email) — deliberately generic (JSONB value)
 * rather than one column per setting, since new settings shouldn't require
 * a migration. Distinct from Feature Flags: flags gate *code paths*
 * on/off; Configuration holds *values* the app reads.
 */
@Entity('system_configuration')
export class SystemConfiguration {
  @PrimaryColumn({ type: 'citext' })
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
