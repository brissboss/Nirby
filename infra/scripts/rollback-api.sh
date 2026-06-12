#!/usr/bin/env bash
# Roll back API to a specific git SHA (image must exist on server or be loaded first).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: rollback-api.sh <staging|prod>}")"
TARGET_SHA="${2:?target git SHA required}"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"

if ! docker image inspect "nirby-api:${TARGET_SHA}" &>/dev/null; then
  echo "ERROR: image nirby-api:${TARGET_SHA} not found. Load it first or run the rollback workflow." >&2
  exit 1
fi

export DEPLOY_SHA="$TARGET_SHA"
export DEPLOY_API_SHA="$TARGET_SHA"

if grep -q '^DEPLOY_API_SHA=' "${DEPLOY_DIR}/.env"; then
  sed -i.bak "s/^DEPLOY_API_SHA=.*/DEPLOY_API_SHA=${TARGET_SHA}/" "${DEPLOY_DIR}/.env"
  rm -f "${DEPLOY_DIR}/.env.bak"
fi

docker tag "nirby-api:${TARGET_SHA}" nirby-api:latest
compose_in_deploy_dir "$DEPLOY_DIR" up -d --force-recreate api

if wait_for_api_ready "$ENV_NAME" 12 5; then
  current="$(read_deployed_sha "$DEPLOY_DIR" api)"
  echo "$current" >"${DEPLOY_DIR}/.previous-api-sha"
  echo "$TARGET_SHA" >"${DEPLOY_DIR}/.deployed-api-sha"
  echo "$(date -Iseconds) rollback api -> ${TARGET_SHA}" >>"${DEPLOY_DIR}/deploy-history.log"
  log "API rolled back to ${TARGET_SHA}"
else
  echo "ERROR: API unhealthy after rollback to ${TARGET_SHA}" >&2
  compose_in_deploy_dir "$DEPLOY_DIR" logs --tail=50 api || true
  exit 1
fi
