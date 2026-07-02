#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

flask --app bootstrap:create_app run --host "${APP_HOST:-0.0.0.0}" --port "${APP_PORT:-4001}"
