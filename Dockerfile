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
RUN cd server && npx prisma generate

# ── Create start script ──
RUN printf '#!/bin/sh\nset -e\necho "[start.sh] Running prisma db push..."\ncd /app/server\nnpx prisma db push --accept-data-loss\necho "[start.sh] Starting server..."\nexec npx tsx src/index.ts\n' > /app/start.sh && chmod +x /app/start.sh

ENV NODE_ENV=production
EXPOSE 3001

CMD ["/app/start.sh"]
