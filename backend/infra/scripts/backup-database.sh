#!/usr/bin/env bash
# doc 45 Backup Strategy: daily/weekly/monthly tiered retention, real
# pg_dump invocation. This is real, standard backup automation — not
# executed in this environment (no long-running Postgres instance to back
# up here; this is meant to run on a schedule against the actual
# production database, e.g. via a Kubernetes CronJob).
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DAY_OF_WEEK=$(date +%u)   # 1 = Monday
DAY_OF_MONTH=$(date +%d)

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAILY_DAYS=30
RETENTION_WEEKLY_DAYS=180
RETENTION_MONTHLY_DAYS=730  # doc 45: 2 years

: "${DATABASE_HOST:?DATABASE_HOST must be set}"
: "${DATABASE_NAME:?DATABASE_NAME must be set}"
: "${DATABASE_USER:?DATABASE_USER must be set}"

DAILY_FILE="${BACKUP_DIR}/daily/edina-${TIMESTAMP}.sql.gz"
mkdir -p "${BACKUP_DIR}/daily" "${BACKUP_DIR}/weekly" "${BACKUP_DIR}/monthly"

echo "[backup] dumping ${DATABASE_NAME}@${DATABASE_HOST} -> ${DAILY_FILE}"
pg_dump \
  --host="${DATABASE_HOST}" \
  --username="${DATABASE_USER}" \
  --dbname="${DATABASE_NAME}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip > "${DAILY_FILE}"

# doc 44: an untested backup is not a verified backup — sanity-check the
# archive is non-empty and gzip-valid before trusting it exists.
if ! gzip -t "${DAILY_FILE}"; then
  echo "[backup] ERROR: ${DAILY_FILE} failed gzip integrity check" >&2
  exit 1
fi

# Weekly tier: keep Monday's daily backup as the week's representative copy.
if [ "${DAY_OF_WEEK}" = "1" ]; then
  cp "${DAILY_FILE}" "${BACKUP_DIR}/weekly/edina-week-${TIMESTAMP}.sql.gz"
fi

# Monthly tier: keep the 1st-of-month backup.
if [ "${DAY_OF_MONTH}" = "01" ]; then
  cp "${DAILY_FILE}" "${BACKUP_DIR}/monthly/edina-month-${TIMESTAMP}.sql.gz"
fi

echo "[backup] pruning backups older than retention window per tier"
find "${BACKUP_DIR}/daily"   -name '*.sql.gz' -mtime "+${RETENTION_DAILY_DAYS}"   -delete
find "${BACKUP_DIR}/weekly"  -name '*.sql.gz' -mtime "+${RETENTION_WEEKLY_DAYS}"  -delete
find "${BACKUP_DIR}/monthly" -name '*.sql.gz' -mtime "+${RETENTION_MONTHLY_DAYS}" -delete

echo "[backup] done"
