#!/bin/sh
set -e
echo "[start.sh] Running prisma db push..."
cd /app/server
./node_modules/.bin/prisma db push --schema prisma/schema.prisma --accept-data-loss --skip-generate
echo "[start.sh] Prisma done."
echo "[start.sh] Checking shared types:"
ls /app/shared/types/ 2>&1 || echo "NOT FOUND"
echo "[start.sh] Launching server with tsx..."
NODE_ENV=production exec ./node_modules/.bin/tsx src/index.ts 2>&1
