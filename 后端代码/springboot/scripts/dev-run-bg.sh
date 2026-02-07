#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export APP_MOCK_DATA_ENABLED="${APP_MOCK_DATA_ENABLED:-true}"

LOG_FILE="$ROOT_DIR/target/dev-run.log"
PID_FILE="$ROOT_DIR/target/dev-run.pid"

mkdir -p "$ROOT_DIR/target"

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" || true)"
  if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "Already running (pid=$old_pid)."
    echo "Log: $LOG_FILE"
    exit 0
  fi
fi

echo "Starting Spring Boot (dev) in background..."
echo "Log: $LOG_FILE"

nohup bash -lc "cd '$ROOT_DIR' && APP_MOCK_DATA_ENABLED='$APP_MOCK_DATA_ENABLED' mvn -DskipTests spring-boot:run" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "Started (pid=$(cat "$PID_FILE"))."
echo "Tail logs: tail -f '$LOG_FILE'"

