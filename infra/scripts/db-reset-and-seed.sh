#!/usr/bin/env bash
# Wipe application data (keep schema + Prisma migrations) and load the oral/demo seed.
#
# Usage on the VPS:
#   CONFIRM_RESET=RESET /opt/nirby/scripts/db-reset-and-seed.sh prod
#   CONFIRM_RESET=RESET /opt/nirby/scripts/db-reset-and-seed.sh staging
#
# Do NOT use `prisma migrate reset` here: it drops the database and would skip
# docker-entrypoint grants for nirby_app.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: CONFIRM_RESET=RESET $0 <staging|prod>}")"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"

if [[ "${CONFIRM_RESET:-}" != "RESET" ]]; then
  echo "Refusing to wipe ${ENV_NAME}." >&2
  echo "Re-run with: CONFIRM_RESET=RESET $0 ${ENV_NAME}" >&2
  exit 1
fi

if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
  echo "ERROR: ${DEPLOY_DIR}/.env not found" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "${DEPLOY_DIR}/.env"
set +a

: "${DB_PASSWORD:?DB_PASSWORD missing in ${DEPLOY_DIR}/.env}"

DEPLOY_SHA="$(read_deployed_sha "$DEPLOY_DIR" api)"
IMAGE="nirby-api:${DEPLOY_SHA}"

if ! docker image inspect "$IMAGE" &>/dev/null; then
  echo "ERROR: image not found: ${IMAGE}" >&2
  exit 1
fi

log "Backing up ${ENV_NAME} before wipe..."
"${SCRIPT_DIR}/db-backup.sh" "$ENV_NAME" "pre-seed"

compose_in_deploy_dir "$DEPLOY_DIR" up -d db redis

log "Checking compiled seed in ${IMAGE}..."
if ! DEPLOY_API_SHA="$DEPLOY_SHA" compose_in_deploy_dir "$DEPLOY_DIR" run --rm --no-deps \
  api node -e "require('fs').accessSync('dist/prisma/seed.js')"; then
  echo "ERROR: dist/prisma/seed.js is missing from ${IMAGE}." >&2
  echo "Deploy an API image that includes the demo seed, or run prisma/seed.ts from your laptop through an SSH tunnel." >&2
  exit 1
fi

log "Wiping Redis rate-limit keys..."
compose_in_deploy_dir "$DEPLOY_DIR" exec -T redis redis-cli FLUSHDB >/dev/null

log "Seeding ${ENV_NAME} (ALLOW_DB_RESET=true)..."
DEPLOY_API_SHA="$DEPLOY_SHA" compose_in_deploy_dir "$DEPLOY_DIR" run --rm --no-deps \
  -e ALLOW_DB_RESET=true \
  -e "DATABASE_URL=postgresql://nirby:${DB_PASSWORD}@db:5432/nirby" \
  -e "MIGRATE_DATABASE_URL=postgresql://nirby:${DB_PASSWORD}@db:5432/nirby" \
  api node dist/prisma/seed.js

log "Demo seed loaded on ${ENV_NAME}"
