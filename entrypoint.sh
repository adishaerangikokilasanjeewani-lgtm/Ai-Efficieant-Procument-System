#!/bin/bash
set -e

echo "=== Starting Procurement System ==="

# Set environment defaults for SQLite
export USE_SQLITE=${USE_SQLITE:-true}
export SECRET_KEY=${SECRET_KEY:-supersecretkey123456789procurement}
export ALGORITHM=${ALGORITHM:-HS256}
export ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-480}

# Move SQLite db to persistent data volume if using SQLite
if [ "$USE_SQLITE" = "true" ]; then
    export SQLITE_PATH=/app/data/procurement.db
    # Seed database if it doesn't exist
    if [ ! -f "$SQLITE_PATH" ]; then
        echo ">>> Seeding database..."
        cd /app/backend
        DB_PATH=$SQLITE_PATH python seed.py || echo "Seed skipped or failed"
    fi
fi

# Start FastAPI backend in background
echo ">>> Starting FastAPI backend on port 8000..."
cd /app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 &

# Wait for backend to be ready
echo ">>> Waiting for backend..."
sleep 5

# Start nginx in foreground
echo ">>> Starting Nginx on port 80..."
nginx -g "daemon off;"
