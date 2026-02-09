#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export APP_BLOCKCHAIN_MODE="${APP_BLOCKCHAIN_MODE:-EVM}"
export APP_SERVER_PORT="${APP_SERVER_PORT:-8081}"

echo "Starting backend (dev) with APP_BLOCKCHAIN_MODE=${APP_BLOCKCHAIN_MODE} on port ${APP_SERVER_PORT}"
echo "Tip: put EVM_RPC_URL/EVM_PRIVATE_KEY/EVM_CONTRACT_ADDRESS in ./后端代码/springboot/.env"

mvn -DskipTests spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments=--server.port="${APP_SERVER_PORT}"
