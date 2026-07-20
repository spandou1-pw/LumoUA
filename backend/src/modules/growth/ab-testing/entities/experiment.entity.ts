import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface ExperimentVariant {
  key: string;
  weight: number; // relative weight; normalized at assignment time, doesn't need to sum to 100
}

@Entity('experiments')
export class Experiment {
  @PrimaryColumn({ type: 'citext' })
  key: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  variants: ExperimentVariant[];

  @Column({ default: false })
  active: boolean;
}
