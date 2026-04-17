FROM node:20-alpine

WORKDIR /app

# ── Install root deps ──
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# ── Install server deps ──
COPY shared/package.json ./shared/
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install

# ── Install client deps ──
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm install

# ── Copy all source ──
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# ── Build client ──
RUN cd client && npx vite build

# ── Verify client dist exists ──
RUN ls -la /app/client/dist/

# ── Generate Prisma client ──
WORKDIR /app/server
RUN npx prisma generate --schema prisma/schema.prisma

# ── Create start script ──
# Use the prisma binary installed in node_modules, not npx (avoids version mismatch)
RUN printf '#!/bin/sh\nset -e\necho "[start.sh] cwd: $(pwd)"\necho "[start.sh] Listing prisma dir:"\nls -la /app/server/prisma/\necho "[start.sh] Running prisma db push..."\ncd /app/server\n./node_modules/.bin/prisma db push --schema prisma/schema.prisma --accept-data-loss\necho "[start.sh] Starting server..."\nNODE_ENV=production exec ./node_modules/.bin/tsx src/index.ts\n' > /app/start.sh && chmod +x /app/start.sh

WORKDIR /app/server

ENV NODE_ENV=production
EXPOSE 3001

CMD ["/app/start.sh"]
