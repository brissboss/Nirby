#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB="$ROOT/apps/web"
STANDALONE="$WEB/.next/standalone"
SERVER="$STANDALONE/apps/web/server.js"

if [[ ! -f "$SERVER" ]]; then
  echo "Missing Next standalone build at $SERVER. Run: pnpm -C apps/web build" >&2
  exit 1
fi

mkdir -p "$STANDALONE/apps/web/.next"
rm -rf "$STANDALONE/apps/web/.next/static"
cp -R "$WEB/.next/static" "$STANDALONE/apps/web/.next/static"
rm -rf "$STANDALONE/apps/web/public"
cp -R "$WEB/public" "$STANDALONE/apps/web/public"

cd "$STANDALONE"
exec node apps/web/server.js
