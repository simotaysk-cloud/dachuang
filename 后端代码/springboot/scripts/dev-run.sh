#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export APP_MOCK_DATA_ENABLED="${APP_MOCK_DATA_ENABLED:-true}"
export APP_SERVER_PORT="${APP_SERVER_PORT:-8091}"

echo "Starting Spring Boot (dev) on http://127.0.0.1:${APP_SERVER_PORT}"
echo "APP_MOCK_DATA_ENABLED=$APP_MOCK_DATA_ENABLED"
echo
echo "Stop with Ctrl-C."
echo

mvn -DskipTests spring-boot:run -Dspring-boot.run.arguments=--server.port="${APP_SERVER_PORT}"
