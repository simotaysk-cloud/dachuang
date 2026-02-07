#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/reset_demo_db.sql"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client not found. Install MySQL client or run the SQL manually:"
  echo "  $SQL_FILE"
  exit 1
fi

echo "Resetting demo database using:"
echo "  mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p < $SQL_FILE"
echo

mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p < "$SQL_FILE"
echo "Done."

