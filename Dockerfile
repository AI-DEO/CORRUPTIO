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
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# ── Build client ──
RUN cd client && npx vite build
RUN ls -la /app/client/dist/

# ── Generate Prisma client ──
WORKDIR /app/server
RUN npx prisma generate --schema prisma/schema.prisma

WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["/app/start.sh"]
