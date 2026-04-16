FROM node:20-alpine

WORKDIR /app

COPY shared/ ./shared/
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/

WORKDIR /app/server
RUN npx prisma generate
CMD ["npx", "tsx", "src/index.ts"]
