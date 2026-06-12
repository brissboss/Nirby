#!/usr/bin/env bash
# Check pending migrations, backup if needed, then run prisma migrate deploy.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: run-migrations.sh <staging|prod>}")"
DEPLOY_SHA="${2:?deploy sha required}"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"

set -a
# shellcheck disable=SC1091
source "${DEPLOY_DIR}/.env"
set +a

BACKUP_POLICY="${BACKUP_POLICY:-always}"
IMAGE="nirby-api:${DEPLOY_SHA}"

if ! docker image inspect "$IMAGE" &>/dev/null; then
  echo "ERROR: image not found: ${IMAGE}" >&2
  exit 1
fi

compose_in_deploy_dir "$DEPLOY_DIR" up -d db redis

log "Checking migration status with ${IMAGE}..."
status_output="$(
  DEPLOY_API_SHA="$DEPLOY_SHA" compose_in_deploy_dir "$DEPLOY_DIR" run --rm --no-deps \
    -e "MIGRATE_DATABASE_URL=postgresql://nirby:${DB_PASSWORD}@db:5432/nirby" \
    api npx prisma migrate status 2>&1 || true
)"

echo "$status_output"

if echo "$status_output" | grep -qi "Database schema is up to date"; then
  log "No pending migrations"
  exit 0
fi

if ! echo "$status_output" | grep -qi "not yet been applied"; then
  if echo "$status_output" | grep -qi "failed migrations"; then
    echo "ERROR: failed migrations detected — fix manually before deploying" >&2
    exit 1
  fi
  log "No pending migrations (or status unclear, continuing)"
  exit 0
fi

pending_migrations="$(
  echo "$status_output" | awk '/not yet been applied:/{flag=1;next} flag && /^[0-9]/{print;next} flag && NF==0{flag=0}'
)"

if [[ -z "$pending_migrations" ]]; then
  pending_migrations="$(
    echo "$status_output" | sed -n '/not yet been applied:/,$p' | grep -E '^[0-9]{14}_' || true
  )"
fi

destructive=0
while IFS= read -r migration; do
  [[ -z "$migration" ]] && continue
  sql_check="$(
    DEPLOY_API_SHA="$DEPLOY_SHA" compose_in_deploy_dir "$DEPLOY_DIR" run --rm --no-deps api \
      cat "prisma/migrations/${migration}/migration.sql" 2>/dev/null || true
  )"
  if echo "$sql_check" | grep -qiE 'DROP[[:space:]]+(TABLE|COLUMN|TYPE|INDEX|SCHEMA)|TRUNCATE[[:space:]]|ALTER[[:space:]]+TABLE.*DROP'; then
    log "Destructive migration detected: ${migration}"
    destructive=1
  fi
done <<<"$pending_migrations"

should_backup=0
case "$BACKUP_POLICY" in
  always) should_backup=1 ;;
  on_destructive)
    if [[ $destructive -eq 1 ]]; then
      should_backup=1
    fi
    ;;
  never) should_backup=0 ;;
  *)
    echo "ERROR: unknown BACKUP_POLICY=${BACKUP_POLICY}" >&2
    exit 1
    ;;
esac

if [[ $should_backup -eq 1 ]]; then
  label="pre-migrate-${DEPLOY_SHA:0:7}"
  "${SCRIPT_DIR}/db-backup.sh" "$ENV_NAME" "$label" >/dev/null
  log "Pre-migration backup created"
else
  log "Skipping backup (BACKUP_POLICY=${BACKUP_POLICY})"
fi

log "Running prisma migrate deploy..."
DEPLOY_API_SHA="$DEPLOY_SHA" compose_in_deploy_dir "$DEPLOY_DIR" run --rm --no-deps \
  -e "MIGRATE_DATABASE_URL=postgresql://nirby:${DB_PASSWORD}@db:5432/nirby" \
  api npx prisma migrate deploy

log "Migrations applied successfully"
