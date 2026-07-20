/**
 * doc 45 Backup Strategy: the tiered retention policy as pure, testable
 * logic. `infra/scripts/backup-database.sh` implements the same policy in
 * bash (where the actual backup runs) — this module exists so the POLICY
 * itself (when does a backup fall out of retention) can be unit-tested,
 * since bash logic bugs in a backup-pruning script are exactly the kind
 * of thing that goes unnoticed until a real incident.
 */
export type BackupTier = 'daily' | 'weekly' | 'monthly';

const RETENTION_DAYS: Record<BackupTier, number> = {
  daily: 30,
  weekly: 180,
  monthly: 730, // doc 45: 2 years
};

export function isWithinRetention(backupDate: Date, tier: BackupTier, now: Date = new Date()): boolean {
  const ageDays = (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= RETENTION_DAYS[tier];
}

export function shouldCreateWeeklyCopy(date: Date): boolean {
  // doc: Monday's daily backup becomes the week's representative copy —
  // getUTCDay() returns 1 for Monday.
  return date.getUTCDay() === 1;
}

export function shouldCreateMonthlyCopy(date: Date): boolean {
  return date.getUTCDate() === 1;
}

export function retentionDaysFor(tier: BackupTier): number {
  return RETENTION_DAYS[tier];
}
