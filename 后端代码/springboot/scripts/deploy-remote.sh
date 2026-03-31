#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${AI_API_KEY:-}" ]]; then
  echo "Missing AI_API_KEY in $ROOT_DIR/.env"
  exit 1
fi

ARTIFACT="$ROOT_DIR/target/dachuang-0.0.1-SNAPSHOT.jar"
REMOTE_HOST="${REMOTE_HOST:-root@cpuzhbc.cn}"

if [[ ! -f "$ARTIFACT" ]]; then
  echo "Artifact not found: $ARTIFACT"
  echo "Run: mvn -DskipTests package"
  exit 1
fi

echo "[1/3] Uploading JAR to $REMOTE_HOST ..."
scp "$ARTIFACT" "$REMOTE_HOST:/root/dachuang-0.0.1-SNAPSHOT.jar"

echo "[2/3] Restarting backend with AI key ..."
ssh "$REMOTE_HOST" "fuser -k 8091/tcp 2>/dev/null || true; sleep 2; nohup env AI_API_KEY='$AI_API_KEY' java -jar /root/dachuang-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev --app.mock-data.enabled=true --app.mock-data.force=true > /root/backend.log 2>&1 &"

echo "[3/3] Checking process ..."
ssh "$REMOTE_HOST" "sleep 3; ps aux | grep dachuang-0.0.1-SNAPSHOT.jar | grep -v grep || true; tail -n 20 /root/backend.log || true"

echo "Remote deploy finished."
