#!/usr/bin/env bash
# Restore PostgreSQL from a pg_dump custom-format file.
# Usage: db-restore.sh <staging|prod> /path/to/backup.dump

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: db-restore.sh <staging|prod> <backup.dump>}")"
BACKUP_FILE="${2:?backup file path required}"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

log "WARNING: restoring ${ENV_NAME} database from ${BACKUP_FILE}"
log "Stopping API to prevent writes..."
compose_in_deploy_dir "$DEPLOY_DIR" stop api || true

log "Restoring database..."
compose_in_deploy_dir "$DEPLOY_DIR" exec -T db \
  pg_restore --clean --if-exists --no-owner --role=nirby -U nirby -d nirby \
  <"$BACKUP_FILE"

log "Database restore complete. Restarting API..."
compose_in_deploy_dir "$DEPLOY_DIR" up -d api

if wait_for_api_ready "$ENV_NAME" 12 5; then
  log "API is healthy after database restore"
else
  echo "ERROR: API unhealthy after database restore" >&2
  compose_in_deploy_dir "$DEPLOY_DIR" logs --tail=50 api || true
  exit 1
fi
