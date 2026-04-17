#!/bin/sh
echo "[start.sh] === CORRUPTIO START ==="
echo "[start.sh] pwd: $(pwd)"
echo "[start.sh] node: $(node --version)"

echo "[start.sh] Running prisma db push..."
cd /app/server
./node_modules/.bin/prisma db push --schema prisma/schema.prisma --accept-data-loss --skip-generate 2>&1
echo "[start.sh] Prisma exit code: $?"

echo "[start.sh] Checking files..."
echo "shared/types: $(ls /app/shared/types/ 2>&1)"
echo "server/src: $(ls /app/server/src/ 2>&1)"
echo "client/dist: $(ls /app/client/dist/ 2>&1)"

echo "[start.sh] Testing node import..."
node -e "console.log('node works, pid:', process.pid)" 2>&1

echo "[start.sh] Launching tsx on port ${PORT:-3001}..."
NODE_ENV=production PORT=${PORT:-3001} ./node_modules/.bin/tsx src/index.ts 2>&1 &
SERVER_PID=$!

# Wait a bit then check if process is alive
sleep 3
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "[start.sh] Server started successfully (pid: $SERVER_PID)"
  wait $SERVER_PID
else
  echo "[start.sh] SERVER CRASHED! Dumping error..."
  # Try running with node directly to see the error
  NODE_ENV=production PORT=${PORT:-3001} node --loader tsx/esm src/index.ts 2>&1 || true
  echo "[start.sh] Keeping container alive for log visibility..."
  sleep 300
fi
