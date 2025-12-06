#!/usr/bin/env sh
set -e

# Ensure required directories exist for bind mounts / PVCs
mkdir -p /app/data /app/Storage /app/Logs

# Default the SQLite DB path if not provided
if [ -z "${ConnectionStrings__DefaultConnection}" ]; then
  export ConnectionStrings__DefaultConnection="Data Source=/app/data/chatapp.db"
fi

exec "$@"

