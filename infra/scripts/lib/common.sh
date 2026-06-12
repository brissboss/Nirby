#!/usr/bin/env bash
# Shared helpers for Nirby deploy scripts.

set -euo pipefail

resolve_compose() {
  if docker compose version &>/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose &>/dev/null; then
    COMPOSE=(docker-compose)
  else
    echo "ERROR: docker compose is not available" >&2
    exit 1
  fi
}

normalize_env() {
  case "$1" in
    staging) echo "staging" ;;
    prod | production) echo "prod" ;;
    *)
      echo "ERROR: unknown environment '$1' (expected staging or prod)" >&2
      exit 1
      ;;
  esac
}

deploy_dir_for_env() {
  case "$(normalize_env "$1")" in
    staging) echo "/opt/nirby/staging" ;;
    prod) echo "/opt/nirby/prod" ;;
  esac
}

backup_dir_for_env() {
  echo "/opt/nirby/backups/$(normalize_env "$1")"
}

api_local_port() {
  case "$(normalize_env "$1")" in
    staging) echo "4001" ;;
    prod) echo "4000" ;;
  esac
}

web_local_port() {
  case "$(normalize_env "$1")" in
    staging) echo "3001" ;;
    prod) echo "3000" ;;
  esac
}

read_deployed_sha() {
  local deploy_dir="$1"
  local service="$2"
  local file="${deploy_dir}/.deployed-${service}-sha"
  if [[ -f "$file" ]]; then
    tr -d '[:space:]' <"$file"
  else
    echo "latest"
  fi
}

log() {
  echo "[$(date -Iseconds)] $*"
}

compose_in_deploy_dir() {
  local deploy_dir="$1"
  shift
  (cd "$deploy_dir" && "${COMPOSE[@]}" --env-file .env "$@")
}

wait_for_api_ready() {
  local env_name="$1"
  local port
  port="$(api_local_port "$env_name")"
  local attempts="${2:-10}"
  local delay="${3:-5}"

  for ((i = 1; i <= attempts; i++)); do
    if response="$(curl -fsS "http://127.0.0.1:${port}/ready" 2>/dev/null)"; then
      if echo "$response" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
        log "API ready on port ${port}"
        return 0
      fi
    fi
    log "API not ready yet (attempt ${i}/${attempts})"
    sleep "$delay"
  done

  return 1
}
