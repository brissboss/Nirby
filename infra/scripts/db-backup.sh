#!/usr/bin/env bash
# Create a PostgreSQL backup before migrations.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: db-backup.sh <staging|prod>}")"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"
BACKUP_DIR="$(backup_dir_for_env "$ENV_NAME")"
LABEL="${2:-manual}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

compose_in_deploy_dir "$DEPLOY_DIR" up -d db

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="${BACKUP_DIR}/nirby-${ENV_NAME}-${LABEL}-${timestamp}.dump"

log "Creating backup: ${backup_file}"
compose_in_deploy_dir "$DEPLOY_DIR" exec -T db \
  pg_dump -Fc -U nirby nirby >"$backup_file"

chmod 600 "$backup_file"
log "Backup complete ($(du -h "$backup_file" | awk '{print $1}'))"

# Keep the 30 most recent backups
mapfile -t old_backups < <(ls -t "${BACKUP_DIR}"/*.dump 2>/dev/null | tail -n +31 || true)
for old in "${old_backups[@]}"; do
  [[ -n "$old" ]] && rm -f "$old"
done

echo "$backup_file"
