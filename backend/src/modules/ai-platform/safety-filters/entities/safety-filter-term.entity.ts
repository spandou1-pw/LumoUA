import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type SafetyFilterCategory = 'spam' | 'hate_speech' | 'harassment' | 'self_harm' | 'illegal_content' | 'other';

/**
 * doc AI.md: deliberately no seed data of actual sensitive terms shipped
 * in this codebase — the list is entirely admin-managed at runtime via
 * `SafetyFiltersAdminController`. This keeps the term list out of source
 * control (where it would be publicly readable in this repo and trivially
 * bypassable once known) and lets moderators tune it for actual observed
 * abuse patterns (including Ukrainian-specific slang/obfuscation, doc 33's
 * language-quality concern) without a code deploy.
 */
@Entity('safety_filter_terms')
@Index(['category', 'active'])
export class SafetyFilterTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stored as a lowercase, trimmed literal or a simple regex pattern (service handles both). */
  @Column({ type: 'text' })
  pattern: string;

  @Column({ name: 'is_regex', default: false })
  isRegex: boolean;

  @Column({ type: 'varchar' })
  category: SafetyFilterCategory;

  @Column({ type: 'smallint', default: 70 })
  severity: number; // 0-100, mirrors AiModerationFlag.confidence's scale for consistent triage

  @Column({ default: true })
  active: boolean;
}
