#!/usr/bin/env bash
# Deploy API: migrate (with backup) → switch container → health check → rollback on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: deploy-api.sh <staging|prod>}")"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"
BACKUP_DIR="$(backup_dir_for_env "$ENV_NAME")"

DEPLOY_SHA="${DEPLOY_SHA:-${DEPLOY_API_SHA:-}}"
if [[ -z "$DEPLOY_SHA" ]]; then
  echo "ERROR: DEPLOY_SHA or DEPLOY_API_SHA must be set" >&2
  exit 1
fi

mkdir -p "$DEPLOY_DIR" "$BACKUP_DIR" /opt/nirby/scripts
chmod 700 "$BACKUP_DIR"

if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
  echo "ERROR: ${DEPLOY_DIR}/.env not found. Run sync-env.sh first." >&2
  exit 1
fi

PREVIOUS_SHA="$(read_deployed_sha "$DEPLOY_DIR" api)"

log "Deploying API to ${ENV_NAME}: ${DEPLOY_SHA} (previous: ${PREVIOUS_SHA})"

# Ensure image tags exist
if docker image inspect "nirby-api:${DEPLOY_SHA}" &>/dev/null; then
  docker tag "nirby-api:${DEPLOY_SHA}" nirby-api:latest
else
  echo "ERROR: image nirby-api:${DEPLOY_SHA} not found on server" >&2
  exit 1
fi

# Migrations before switching the running API container (old API keeps running)
"${SCRIPT_DIR}/run-migrations.sh" "$ENV_NAME" "$DEPLOY_SHA"

# Update .env with new SHA after successful migrations
if grep -q '^DEPLOY_API_SHA=' "${DEPLOY_DIR}/.env"; then
  sed -i.bak "s/^DEPLOY_API_SHA=.*/DEPLOY_API_SHA=${DEPLOY_SHA}/" "${DEPLOY_DIR}/.env"
  rm -f "${DEPLOY_DIR}/.env.bak"
else
  echo "DEPLOY_API_SHA=${DEPLOY_SHA}" >>"${DEPLOY_DIR}/.env"
fi

# Ensure infrastructure is up, then switch API
compose_in_deploy_dir "$DEPLOY_DIR" up -d db redis
compose_in_deploy_dir "$DEPLOY_DIR" up -d --force-recreate api

log "Waiting for API health check..."
sleep 5
if ! wait_for_api_ready "$ENV_NAME" 12 5; then
  log "ERROR: API health check failed after deploy"

  if [[ "$PREVIOUS_SHA" != "latest" && "$PREVIOUS_SHA" != "$DEPLOY_SHA" ]] \
    && docker image inspect "nirby-api:${PREVIOUS_SHA}" &>/dev/null; then
    log "Rolling back API image to ${PREVIOUS_SHA}"
    if grep -q '^DEPLOY_API_SHA=' "${DEPLOY_DIR}/.env"; then
      sed -i.bak "s/^DEPLOY_API_SHA=.*/DEPLOY_API_SHA=${PREVIOUS_SHA}/" "${DEPLOY_DIR}/.env"
      rm -f "${DEPLOY_DIR}/.env.bak"
    fi
    docker tag "nirby-api:${PREVIOUS_SHA}" nirby-api:latest
    compose_in_deploy_dir "$DEPLOY_DIR" up -d --force-recreate api
    log "Rollback complete — previous API version restored"
  else
    log "WARNING: cannot rollback image (previous SHA unavailable: ${PREVIOUS_SHA})"
  fi

  compose_in_deploy_dir "$DEPLOY_DIR" logs --tail=80 api || true
  exit 1
fi

# Record deployment state
if [[ "$PREVIOUS_SHA" != "$DEPLOY_SHA" ]]; then
  echo "$PREVIOUS_SHA" >"${DEPLOY_DIR}/.previous-api-sha"
fi
echo "$DEPLOY_SHA" >"${DEPLOY_DIR}/.deployed-api-sha"
echo "$(date -Iseconds) api ${DEPLOY_SHA} (prev ${PREVIOUS_SHA})" >>"${DEPLOY_DIR}/deploy-history.log"

KEEP_IMAGES="${KEEP_IMAGES:-5}"
export KEEP_IMAGES
"${SCRIPT_DIR}/prune-images.sh" "$ENV_NAME"

compose_in_deploy_dir "$DEPLOY_DIR" logs --tail=30 api
log "API deploy successful: ${DEPLOY_SHA}"
