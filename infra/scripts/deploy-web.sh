#!/usr/bin/env bash
# Deploy web container with SHA pinning.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

resolve_compose

ENV_NAME="$(normalize_env "${1:?usage: deploy-web.sh <staging|prod>}")"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"

DEPLOY_SHA="${DEPLOY_SHA:-${DEPLOY_WEB_SHA:-}}"
if [[ -z "$DEPLOY_SHA" ]]; then
  echo "ERROR: DEPLOY_SHA or DEPLOY_WEB_SHA must be set" >&2
  exit 1
fi

if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
  echo "ERROR: ${DEPLOY_DIR}/.env not found. Run sync-env.sh first." >&2
  exit 1
fi

PREVIOUS_SHA="$(read_deployed_sha "$DEPLOY_DIR" web)"

log "Deploying web to ${ENV_NAME}: ${DEPLOY_SHA} (previous: ${PREVIOUS_SHA})"

if docker image inspect "nirby-web:${DEPLOY_SHA}" &>/dev/null; then
  docker tag "nirby-web:${DEPLOY_SHA}" nirby-web:latest
else
  echo "ERROR: image nirby-web:${DEPLOY_SHA} not found on server" >&2
  exit 1
fi

if grep -q '^DEPLOY_WEB_SHA=' "${DEPLOY_DIR}/.env"; then
  sed -i.bak "s/^DEPLOY_WEB_SHA=.*/DEPLOY_WEB_SHA=${DEPLOY_SHA}/" "${DEPLOY_DIR}/.env"
  rm -f "${DEPLOY_DIR}/.env.bak"
else
  echo "DEPLOY_WEB_SHA=${DEPLOY_SHA}" >>"${DEPLOY_DIR}/.env"
fi

compose_in_deploy_dir "$DEPLOY_DIR" up -d --force-recreate web

port="$(web_local_port "$ENV_NAME")"
sleep 5
for ((i = 1; i <= 10; i++)); do
  if curl -fsS "http://127.0.0.1:${port}/" >/dev/null 2>&1; then
    log "Web is responding on port ${port}"
    break
  fi
  if [[ $i -eq 10 ]]; then
    log "ERROR: web health check failed"
    if [[ "$PREVIOUS_SHA" != "latest" && "$PREVIOUS_SHA" != "$DEPLOY_SHA" ]] \
      && docker image inspect "nirby-web:${PREVIOUS_SHA}" &>/dev/null; then
      log "Rolling back web to ${PREVIOUS_SHA}"
      sed -i.bak "s/^DEPLOY_WEB_SHA=.*/DEPLOY_WEB_SHA=${PREVIOUS_SHA}/" "${DEPLOY_DIR}/.env"
      rm -f "${DEPLOY_DIR}/.env.bak"
      docker tag "nirby-web:${PREVIOUS_SHA}" nirby-web:latest
      compose_in_deploy_dir "$DEPLOY_DIR" up -d --force-recreate web
    fi
    exit 1
  fi
  sleep 5
done

if [[ "$PREVIOUS_SHA" != "$DEPLOY_SHA" ]]; then
  echo "$PREVIOUS_SHA" >"${DEPLOY_DIR}/.previous-web-sha"
fi
echo "$DEPLOY_SHA" >"${DEPLOY_DIR}/.deployed-web-sha"
echo "$(date -Iseconds) web ${DEPLOY_SHA} (prev ${PREVIOUS_SHA})" >>"${DEPLOY_DIR}/deploy-history.log"

KEEP_IMAGES="${KEEP_IMAGES:-5}"
export KEEP_IMAGES
"${SCRIPT_DIR}/prune-images.sh" "$ENV_NAME"

compose_in_deploy_dir "$DEPLOY_DIR" logs --tail=20 web
log "Web deploy successful: ${DEPLOY_SHA}"
