import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('founder_program_members')
export class FounderProgramMember {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  /** doc: the user's signup rank at qualification time (e.g. "you were user #47") — a real, meaningful number, not decorative. */
  @Column({ name: 'signup_rank', type: 'int' })
  signupRank: number;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamptz' })
  grantedAt: Date;
}
