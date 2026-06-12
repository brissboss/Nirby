#!/usr/bin/env bash
# Copy deploy assets from /tmp (uploaded by CI) to /opt/nirby.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

ENV_NAME="$(normalize_env "${1:?usage: install-deploy-assets.sh <staging|prod>}")"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"

mkdir -p /opt/nirby/scripts "${DEPLOY_DIR}" "${DEPLOY_DIR}/db-init" "$(backup_dir_for_env "$ENV_NAME")"
chmod 700 "$(backup_dir_for_env "$ENV_NAME")"

if [[ -d /tmp/infra/scripts ]]; then
  cp -r /tmp/infra/scripts/* /opt/nirby/scripts/
elif [[ -d /tmp/scripts ]]; then
  cp -r /tmp/scripts/* /opt/nirby/scripts/
fi

find /opt/nirby/scripts -name '*.sh' -exec chmod +x {} \;

if [[ -f /tmp/docker-compose.yaml ]]; then
  cp /tmp/docker-compose.yaml "${DEPLOY_DIR}/docker-compose.yaml"
elif [[ -f "/tmp/infra/${ENV_NAME}/docker-compose.yaml" ]]; then
  cp "/tmp/infra/${ENV_NAME}/docker-compose.yaml" "${DEPLOY_DIR}/docker-compose.yaml"
fi

if [[ -d "/tmp/infra/${ENV_NAME}/db-init" ]]; then
  mkdir -p "${DEPLOY_DIR}/db-init"
  for src in "/tmp/infra/${ENV_NAME}/db-init/"*; do
    [[ -e "$src" ]] || continue
    name="$(basename "$src")"
    dest="${DEPLOY_DIR}/db-init/${name}"

    # Fix bad server state (e.g. file path created as a directory by a prior bad copy).
    if [[ -e "$dest" ]]; then
      if [[ -d "$dest" && -f "$src" ]]; then
        log "Replacing directory with file: ${dest}"
        rm -rf "$dest"
      elif [[ -f "$dest" ]]; then
        rm -f "$dest"
      elif [[ -d "$dest" && -d "$src" ]]; then
        rm -rf "$dest"
      fi
    fi

    if [[ -f "$src" ]]; then
      install -m 755 "$src" "$dest"
    else
      cp -a "$src" "$dest"
    fi
  done
fi

log "Deploy assets installed for ${ENV_NAME} at ${DEPLOY_DIR}"
