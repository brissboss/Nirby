#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root from this file (apps/e2e/scripts/...), not from cwd.
# Going up two levels lands on apps/ and produced apps/apps/web in CI.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR"
while [[ "$ROOT" != "/" && ! -f "$ROOT/pnpm-workspace.yaml" ]]; do
  ROOT="$(dirname "$ROOT")"
done
if [[ ! -f "$ROOT/pnpm-workspace.yaml" ]]; then
  echo "Could not find repo root from $SCRIPT_DIR" >&2
  exit 1
fi

WEB="$ROOT/apps/web"
STANDALONE="$WEB/.next/standalone"
SERVER="$STANDALONE/apps/web/server.js"

if [[ ! -f "$SERVER" ]]; then
  echo "Missing Next standalone build at $SERVER. Run: pnpm -C apps/web build" >&2
  exit 1
fi

# Match apps/web/Dockerfile: static + public live next to the standalone server.
mkdir -p "$STANDALONE/apps/web/.next"
rm -rf "$STANDALONE/apps/web/.next/static"
cp -R "$WEB/.next/static" "$STANDALONE/apps/web/.next/static"
rm -rf "$STANDALONE/apps/web/public"
cp -R "$WEB/public" "$STANDALONE/apps/web/public"

cd "$STANDALONE"
exec node apps/web/server.js
