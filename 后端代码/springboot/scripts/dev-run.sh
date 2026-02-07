#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export APP_MOCK_DATA_ENABLED="${APP_MOCK_DATA_ENABLED:-true}"

echo "Starting Spring Boot (dev) on http://127.0.0.1:8081"
echo "APP_MOCK_DATA_ENABLED=$APP_MOCK_DATA_ENABLED"
echo
echo "Stop with Ctrl-C."
echo

mvn -DskipTests spring-boot:run

