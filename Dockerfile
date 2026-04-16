FROM node:20-alpine AS base

WORKDIR /app

# ── Install dependencies ──
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

RUN npm install --ignore-scripts
RUN cd server && npm install
RUN cd client && npm install

# ── Copy source ──
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# ── Build client ──
RUN cd client && npx vite build

# ── Generate Prisma client ──
RUN cd server && npx prisma generate

# ── Runtime ──
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/server
CMD ["npx", "tsx", "src/index.ts"]
