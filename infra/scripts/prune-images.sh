#!/usr/bin/env bash
# Keep recent nirby-api / nirby-web images; remove older unused tags.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

ENV_NAME="$(normalize_env "${1:?usage: prune-images.sh <staging|prod>}")"
DEPLOY_DIR="$(deploy_dir_for_env "$ENV_NAME")"
KEEP_IMAGES="${KEEP_IMAGES:-5}"

protected_tags() {
  local tag
  for tag in latest; do
    echo "$tag"
  done
  for file in .deployed-api-sha .previous-api-sha .deployed-web-sha .previous-web-sha; do
    if [[ -f "${DEPLOY_DIR}/${file}" ]]; then
      tr -d '[:space:]' <"${DEPLOY_DIR}/${file}"
    fi
  done | grep -v '^latest$' || true
}

prune_repo() {
  local repo="$1"
  local -a protected=()
  mapfile -t protected < <(protected_tags | sort -u)

  mapfile -t all_tags < <(docker images "$repo" --format '{{.Tag}}' | grep -v '<none>' | sort -u)

  local -a removable=()
  for tag in "${all_tags[@]}"; do
  local is_protected=0
    for p in "${protected[@]}"; do
      if [[ "$tag" == "$p" ]]; then
        is_protected=1
        break
      fi
    done
    if [[ $is_protected -eq 0 && "$tag" != "latest" ]]; then
      removable+=("$tag")
    fi
  done

  if ((${#removable[@]} <= KEEP_IMAGES)); then
    log "No prune needed for ${repo} (${#removable[@]} removable tags, keep ${KEEP_IMAGES})"
    return 0
  fi

  local remove_count=$((${#removable[@]} - KEEP_IMAGES))
  log "Pruning ${remove_count} old ${repo} image(s)"

  for ((i = 0; i < remove_count; i++)); do
    log "Removing ${repo}:${removable[$i]}"
    docker rmi "${repo}:${removable[$i]}" 2>/dev/null || true
  done
}

prune_repo "nirby-api"
prune_repo "nirby-web"
docker image prune -f >/dev/null 2>&1 || true

log "Image prune complete"
