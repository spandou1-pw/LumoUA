import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('mutes')
export class Mute {
  @PrimaryColumn({ name: 'muter_id', type: 'uuid' })
  muterId: string;

  @PrimaryColumn({ name: 'muted_id', type: 'uuid' })
  mutedId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
